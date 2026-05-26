const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

export const getCourseId = (course) => course?._id || course?.id;

export const stripHtml = (value = '') => {
  if (!value) return '';
  const container = document.createElement('div');
  container.innerHTML = value;
  return container.textContent || container.innerText || '';
};

export const getCourseImageUrl = (course) => {
  const image = course?.thumbnail || course?.image;
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('data:')) return image;
  if (image.startsWith('/assets/') || image.startsWith('/course/')) return `${API_URL}${image}`;
  const id = getCourseId(course);
  return id ? `${API_URL}/course/images/${id}/${image}` : `${API_URL}/${image}`;
};

export const getVideoId = (video) => {
  const value = video?.vimeoVideoId || video?.videoId || video?.url || video?.uri || '';
  if (!value) return '';
  const match = String(value).match(/(?:videos\/|vimeo\.com\/)?(\d+)/);
  return match?.[1] || String(value);
};

export const getCourseStats = (course) => {
  const allSections = course?.sections || [];
  // Only count sections that are published (default to true if field is undefined/absent)
  const sections = allSections.filter(section => section && section.published !== false);
  const videos = sections.reduce((count, section) => count + (section.videos?.length || 0), 0);
  const freeSections = sections.filter(section => section && (!section.isLocked || section.isPreviewable)).length;

  return {
    sections: sections.length,
    videos,
    freeSections
  };
};

export const getPlanMeta = (plan = 'Free') => {
  const normalized = String(plan).toLowerCase();

  if (normalized === 'premium') {
    return {
      label: 'Premium',
      tone: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
      action: 'Pay to unlock'
    };
  }

  if (normalized === 'freemium') {
    return {
      label: 'Freemium',
      tone: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
      action: 'Start free preview'
    };
  }

  return {
    label: 'Free',
    tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    action: 'Enroll free'
  };
};

export const canAccessSection = (course, section, enrollmentStatus) => {
  const plan = String(course?.plan || 'Free').toLowerCase();
  if (plan === 'free') return true;
  if (!section?.isLocked || section?.isPreviewable) return true;
  if (String(course?.paymentType || '').toLowerCase() === 'per_chapter') {
    const paidSections = enrollmentStatus?.paidSections || [];
    return paidSections.some(id => String(id?._id || id) === String(section?._id));
  }
  return enrollmentStatus?.isEnrolled && enrollmentStatus?.isPaid;
};
