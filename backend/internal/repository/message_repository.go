package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"zoq/backend/internal/domain"
)

type MessageRepository struct {
	db *pgxpool.Pool
}

func NewMessageRepository(db *pgxpool.Pool) *MessageRepository {
	return &MessageRepository{db: db}
}

func (r *MessageRepository) GetOrCreateConversation(ctx context.Context, userOne, userTwo uuid.UUID, subject *string) (*domain.Conversation, error) {
	// Normalize participant order to satisfy UNIQUE(participant_one, participant_two)
	p1, p2 := userOne, userTwo
	if p1.String() > p2.String() {
		p1, p2 = userTwo, userOne
	}

	query := `
		INSERT INTO conversations (id, participant_one, participant_two, subject, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (participant_one, participant_two) DO UPDATE SET
			updated_at = EXCLUDED.updated_at
		RETURNING id, participant_one, participant_two, subject, updated_at
	`
	conv := &domain.Conversation{}
	now := time.Now()
	err := r.db.QueryRow(ctx, query, uuid.New(), p1, p2, subject, now).Scan(
		&conv.ID, &conv.ParticipantOne, &conv.ParticipantTwo, &conv.Subject, &conv.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return conv, nil
}

func (r *MessageRepository) ListUserConversations(ctx context.Context, userID uuid.UUID) ([]domain.ConversationItem, error) {
	query := `
		SELECT c.id, 
		       CASE WHEN c.participant_one = $1 THEN c.participant_two ELSE c.participant_one END as other_user_id,
		       u.full_name as other_user_name,
		       u.avatar_url as other_avatar_url,
		       c.subject,
		       (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
		       c.updated_at as last_message_at
		FROM conversations c
		JOIN users u ON u.id = CASE WHEN c.participant_one = $1 THEN c.participant_two ELSE c.participant_one END
		WHERE c.participant_one = $1 OR c.participant_two = $1
		ORDER BY c.updated_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var convs []domain.ConversationItem
	for rows.Next() {
		var item domain.ConversationItem
		err := rows.Scan(
			&item.ID, &item.OtherUserID, &item.OtherUserName, &item.OtherAvatarURL,
			&item.Subject, &item.LastMessage, &item.LastMessageAt,
		)
		if err != nil {
			return nil, err
		}
		convs = append(convs, item)
	}
	return convs, nil
}

func (r *MessageRepository) SendMessage(ctx context.Context, conversationID, senderID uuid.UUID, content string) (*domain.Message, error) {
	msgID := uuid.New()
	now := time.Now()

	queryMsg := `
		INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
		VALUES ($1, $2, $3, $4, FALSE, $5)
		RETURNING id, conversation_id, sender_id, content, is_read, created_at
	`
	msg := &domain.Message{}
	err := r.db.QueryRow(ctx, queryMsg, msgID, conversationID, senderID, content, now).Scan(
		&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.Content, &msg.IsRead, &msg.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Update conversation updated_at
	_, _ = r.db.Exec(ctx, `UPDATE conversations SET updated_at = $1 WHERE id = $2`, now, conversationID)

	return msg, nil
}

func (r *MessageRepository) ListMessages(ctx context.Context, conversationID uuid.UUID) ([]domain.Message, error) {
	query := `
		SELECT id, conversation_id, sender_id, content, is_read, created_at
		FROM messages
		WHERE conversation_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []domain.Message
	for rows.Next() {
		var m domain.Message
		err := rows.Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.Content, &m.IsRead, &m.CreatedAt)
		if err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, nil
}

