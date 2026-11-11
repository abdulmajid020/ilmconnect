import { AuthService } from './auth.service';
import { ClassesService } from './classes.service';
import { LearnersService } from './learners.service';
import { QuestionsService } from './questions.service';
import { RequestsService } from './requests.service';
import { TeachersService } from './teachers.service';

export {
  AuthService,
  ClassesService,
  LearnersService,
  QuestionsService,
  RequestsService,
  TeachersService,
};

/** Unified API client facade for backward compatibility */
export const api = {
  // Auth
  register: AuthService.register,
  login: AuthService.login,
  me: AuthService.me,

  // Learners
  saveProfile: LearnersService.saveProfile,
  getProfile: LearnersService.getProfile,
  getMyClasses: LearnersService.getMyClasses,
  getMyTeachers: LearnersService.getMyTeachers,

  // Teachers & 1-on-1
  searchTeachers: TeachersService.searchTeachers,
  getTeacher: TeachersService.getTeacher,
  getNearbyTeachers: TeachersService.getNearbyTeachers,
  addTeacherLocation: TeachersService.addTeacherLocation,
  getMyTeacherLocations: TeachersService.getMyTeacherLocations,
  deleteTeacherLocation: TeachersService.deleteTeacherLocation,

  // Requests
  sendRequest: RequestsService.sendRequest,
  getReceivedRequests: RequestsService.getReceivedRequests,
  respondToRequest: RequestsService.respondToRequest,

  // Classes
  listClasses: ClassesService.listClasses,
  getClass: ClassesService.getClass,
  enrollClass: ClassesService.enrollClass,
  getClassSessions: ClassesService.getClassSessions,
  getTeacherMyClasses: ClassesService.getTeacherMyClasses,
  createClass: ClassesService.createClass,
  getClassRoster: ClassesService.getClassRoster,
  createSession: ClassesService.createSession,

  // Questions & Fatwa
  listQuestions: QuestionsService.listQuestions,
  createQuestion: QuestionsService.createQuestion,
  answerQuestion: QuestionsService.answerQuestion,
  getAnswers: QuestionsService.getAnswers,
};
