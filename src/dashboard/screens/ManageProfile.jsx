import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { selectCurrentUserProfile, setCredentials } from '../../redux/authSlice';
import { userService } from '../../services/userService';
import { API_ORIGIN } from '../../config/apiConfig';

function ManageProfile() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const userProfile = useSelector(selectCurrentUserProfile);

  // Form states
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    language: userProfile?.language || i18n.language || 'fr',
    password: '',
    confirmPassword: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync avatar preview with userProfile
  useEffect(() => {
    if (userProfile?.avatar) {
      const fullUrl = userProfile.avatar.startsWith('http')
        ? userProfile.avatar
        : `${API_ORIGIN}${userProfile.avatar}`;
      setAvatarPreview(fullUrl);
    } else {
      setAvatarPreview('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80&auto=format&fit=crop');
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error(t('auth.errors.password_mismatch', 'Passwords do not match!'));
      return;
    }

    setLoading(true);

    try {
      const submissionData = new FormData();
      submissionData.append('firstName', formData.firstName);
      submissionData.append('lastName', formData.lastName);
      submissionData.append('email', formData.email);
      submissionData.append('phone', formData.phone);
      submissionData.append('language', formData.language);
      
      if (formData.password) {
        submissionData.append('password', formData.password);
      }
      if (avatarFile) {
        submissionData.append('avatar', avatarFile);
      }

      const updatedUser = await userService.updateProfile(submissionData);
      
      // Update Redux Credentials
      dispatch(setCredentials({
        token: sessionStorage.getItem('token'),
        userId: updatedUser._id,
        userRoles: [updatedUser.role],
        userName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        profile: updatedUser
      }));

      // Adjust i18n if user changed default interface language
      if (formData.language !== i18n.language) {
        i18n.changeLanguage(formData.language);
      }

      toast.success(t('profile.success', 'Profile updated successfully!'));
      
      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
      setAvatarFile(null);
    } catch (err) {
      const errMsg = err.response?.data?.message || t('profile.error', 'Failed to update profile');
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const userRoleDisplay = userProfile?.role === 'superadmin' 
    ? 'System Administrator' 
    : (userProfile?.role === 'admin' 
      ? 'Administrator' 
      : userProfile?.role === 'teacher' 
        ? 'Teacher' 
        : userProfile?.role === 'advisor' 
          ? 'Advisor' 
          : 'Student');

  return (
    <section className="dashboard-panel dashboard-profile-manage-page min-h-[calc(100vh-200px)] p-6 text-white font-['Outfit']">

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Left Column: Glassmorphic Identity Panel */}
        <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-blue-500/30">
          <div className="relative group">
            {/* Avatar Pulse Ring */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500 to-emerald-500 opacity-60 blur-lg group-hover:opacity-100 transition duration-300"></div>
            <div className="relative h-40 w-40 overflow-hidden rounded-3xl border-2 border-white/20 shadow-2xl">
              <img 
                src={avatarPreview} 
                alt="Profile Preview" 
                className="h-full w-full object-cover"
              />
            </div>
            {/* Custom File Upload Trigger Over Image */}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-3xl bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <i className="fa-solid fa-camera text-2xl text-white"></i>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
            </label>
          </div>

          <label className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-blue-100 transition hover:border-blue-400/40 hover:bg-blue-500/10">
            <i className="fa-solid fa-image" aria-hidden="true"></i>
            {avatarFile ? avatarFile.name : 'Choose profile image'}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              className="hidden" 
            />
          </label>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            This image appears on your dashboard profile and in direct messages.
          </p>

          <h2 className="mt-6 text-2xl font-black text-white tracking-tight">
            {`${formData.firstName} ${formData.lastName}`.trim() || userProfile?.email || 'InterLink User'}
          </h2>
          <span className="mt-1 inline-flex items-center rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-blue-400">
            {userRoleDisplay}
          </span>
          <p className="mt-2 text-sm text-slate-400">{formData.email}</p>

          <div className="mt-8 w-full border-t border-white/15 pt-6 text-left space-y-4">
            <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</span>
              <strong className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active & Verified
              </strong>
            </div>

            <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Tier</span>
              <strong className="text-xs font-extrabold text-blue-400">
                Encrypted Session
              </strong>
            </div>
          </div>
        </div>

        {/* Right Column: Custom Glassmorphic Settings Panel */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-emerald-500/20 animate-fade-up">
          
          <div className="mb-6 border-b border-white/10 pb-4">
            <h3 className="text-2xl font-black text-white">Account Settings</h3>
            <p className="text-slate-400 text-sm mt-1">Configure your personal credentials and customize language environments.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Row 1: First Name & Last Name */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">First Name</span>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-blue-500/50 focus:bg-white/[0.08]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Last Name</span>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-blue-500/50 focus:bg-white/[0.08]"
                />
              </label>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Email Address</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-blue-500/50 focus:bg-white/[0.08]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Phone Number</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+237 ..."
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-blue-500/50 focus:bg-white/[0.08]"
                />
              </label>
            </div>

            {/* Row 3: System Language */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Dashboard Language</span>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-sm text-white outline-none transition focus:border-blue-500/50"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="de">🇩🇪 Deutsch</option>
                  <option value="it">🇮🇹 Italiano</option>
                </select>
              </label>
            </div>

            {/* Row 4: Passwords */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 border-t border-white/10 pt-6">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">New Password</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-blue-500/50 focus:bg-white/[0.08]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-blue-500/50 focus:bg-white/[0.08]"
                />
              </label>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-emerald-500/20"
                style={{
                  background: 'linear-gradient(to right, #2563eb, #10b981)',
                }}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk text-lg"></i>
                    Save Profile Changes
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>
    </section>
  );
}

export default ManageProfile;
