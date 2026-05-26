import axiosInstance from '../config/axiosConfig';

export const courseService = {
  // --- Courses ---
  getCourses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/courses${query ? `?${query}` : ''}`);
    return response.data;
  },

  getCourseDetails: async (courseId) => {
    const response = await axiosInstance.get(`/courses/${courseId}`);
    return response.data;
  },

  createCourse: async (data) => {
    const response = await axiosInstance.post('/courses', data);
    return response.data;
  },

  updateCourse: async (courseId, data) => {
    const response = await axiosInstance.put(`/courses/${courseId}`, data);
    return response.data;
  },

  deleteCourse: async (courseId) => {
    const response = await axiosInstance.delete(`/courses/${courseId}`);
    return response.data;
  },

  updateCourseStatus: async (courseId, data) => {
    const response = await axiosInstance.patch(`/courses/${courseId}/status`, data);
    return response.data;
  },

  updateCourseBasicInfo: async (courseId, data) => {
    const response = await axiosInstance.patch(`/courses/${courseId}/basic`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // --- Sections ---
  createSection: async (courseId, data) => {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const response = await axiosInstance.post(`/courses/${courseId}/sections`, data, { headers });
    return response.data;
  },

  updateSection: async (sectionId, data) => {
    const response = await axiosInstance.put(`/sections/${sectionId}`, data);
    return response.data;
  },

  deleteSection: async (sectionId) => {
    const response = await axiosInstance.delete(`/sections/${sectionId}`);
    return response.data;
  },

  publishSection: async (sectionId, publishedStatus) => {
    const response = await axiosInstance.patch(`/sections/${sectionId}/publish`, { published: publishedStatus });
    return response.data;
  },

  // --- Videos (within a Section context) ---
  getVideos: async (sectionId) => {
    const response = await axiosInstance.get(`/sections/${sectionId}/videos`);
    return response.data;
  },

  addVideo: async (sectionId, videoData) => {
    const response = await axiosInstance.put(`/sections/${sectionId}/videos`, videoData);
    return response.data;
  },

  updateVideoDetails: async (videoId, videoData) => {
    const response = await axiosInstance.patch(`/videos/${videoId}`, videoData);
    return response.data;
  },

  deleteVideoFromSection: async (sectionId, videoDbId) => {
    const response = await axiosInstance.delete(`/sections/${sectionId}/videos/${videoDbId}`);
    return response.data;
  },

  // AI Quiz Generation
  generateNotionQuizApi: async (payload) => {
    const response = await axiosInstance.post('/ai/generate-mcq', payload);
    return response.data;
  },

  // --- Video File Upload ---
  uploadVideoFile: async (formData, onUploadProgressCallback) => {
    const response = await axiosInstance.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onUploadProgressCallback
    });
    return response.data;
  },

  // --- Markers ---
  addMarkerToVideo: async (dbVideoId, markerData) => {
    const response = await axiosInstance.post(`/videos/${dbVideoId}/markers`, markerData);
    return response.data;
  },

  updateMarkerInVideo: async (dbVideoId, markerId, markerData) => {
    const response = await axiosInstance.patch(`/videos/${dbVideoId}/markers/${markerId}`, markerData);
    return response.data;
  },

  deleteMarkerFromVideo: async (dbVideoId, markerId) => {
    const response = await axiosInstance.delete(`/videos/${dbVideoId}/markers/${markerId}`);
    return response.data;
  },

  // === Enrollments ===
  getMyEnrolledCourses: async () => {
    const response = await axiosInstance.get('/enrollments/my');
    return response.data;
  },

  getMyCourseEnrollmentStatus: async (courseId) => {
    const response = await axiosInstance.get(`/enrollments/course/${courseId}/status`);
    return response.data;
  },

  enrollInCourse: async (courseId) => {
    const response = await axiosInstance.post('/enrollments', { courseId });
    return response.data;
  },

  initiateCoursePayment: async (courseId, payload = {}) => {
    const response = await axiosInstance.post(`/enrollments/course/${courseId}/initiate-payment`, payload);
    return response.data;
  },

  getCoursePaymentStatus: async (transactionId) => {
    const response = await axiosInstance.get(`/enrollments/course-payment-status/${transactionId}`);
    return response.data;
  },

  // === Progress & Quizzes ---
  generateNotionQuizApi: async (payload) => {
    const response = await axiosInstance.post('/ai/generate-mcq', payload);
    return response.data;
  },

  updateProgressApi: async (enrollmentId, progressData) => {
    const response = await axiosInstance.post(`/enrollments/${enrollmentId}/progress`, progressData);
    return response.data;
  },

  updateMyCourseProgress: async (courseId, progressData) => {
    const status = await courseService.getMyCourseEnrollmentStatus(courseId);
    if (!status?.enrollmentId) {
      throw new Error('No enrollment found for this course.');
    }
    const response = await axiosInstance.post(`/enrollments/${status.enrollmentId}/progress`, progressData);
    return response.data;
  },

  requestSectionAccess: async (enrollmentId, sectionId) => {
    const response = await axiosInstance.post(`/enrollments/${enrollmentId}/section-access`, { sectionId });
    return response.data;
  },

  askCourseAssistant: async (payload) => {
    const response = await axiosInstance.post('/ai/course-assistant', payload);
    return response.data;
  },

  getChapterCanvas: async ({ courseId, sectionId }) => {
    const response = await axiosInstance.get('/ai/chapter-canvas', {
      params: { courseId, sectionId }
    });
    return response.data;
  },

  generateChapterCanvas: async (payload) => {
    const response = await axiosInstance.post('/ai/chapter-canvas', payload);
    return response.data;
  },

  saveChapterCanvasProgress: async (payload) => {
    const response = await axiosInstance.post('/ai/chapter-canvas/progress', payload);
    return response.data;
  },

  generateChapterPracticeQuiz: async (payload) => {
    const response = await axiosInstance.post('/ai/chapter-canvas/practice-quiz', payload);
    return response.data;
  },

  submitChapterPracticeQuiz: async (payload) => {
    const response = await axiosInstance.post('/ai/chapter-canvas/practice-quiz/submit', payload);
    return response.data;
  },

  getCourseExam: async (courseId) => {
    const response = await axiosInstance.get(`/ai/courses/${courseId}/exam`);
    return response.data;
  },

  generateCourseExam: async (payload) => {
    const response = await axiosInstance.post('/ai/courses/exam/generate', payload);
    return response.data;
  },

  updateCourseExam: async (courseId, payload) => {
    const response = await axiosInstance.put(`/ai/courses/${courseId}/exam`, payload);
    return response.data;
  },

  submitCourseExam: async (courseId, payload) => {
    const response = await axiosInstance.post(`/ai/courses/${courseId}/exam/submit`, payload);
    return response.data;
  }
};
