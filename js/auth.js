// Authentication functions using Supabase
class AuthManager {
    constructor() {
        this.user = null;
        this.session = null;
        this.coursesLoaded = false;
        this.loadingCourses = false;
    }

    // Sign up with email and password
    async signUp(email, password) {
        try {
            showLoading(true);
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });

            if (error) throw error;

            if (data.user && !data.user.email_confirmed_at) {
                showMessage('Please check your email for a confirmation link!', 'info');
            } else if (data.user) {
                showMessage('Account created successfully!', 'success');
                this.handleAuthChange(data);
            }

            return { data, error: null };
        } catch (error) {
            console.error('Sign up error:', error);
            showMessage(error.message, 'error');
            return { data: null, error };
        } finally {
            showLoading(false);
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            showLoading(true);
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            
            showMessage('Logged in successfully!', 'success');
            this.handleAuthChange(data);
            return { data, error: null };
        } catch (error) {
            console.error('Sign in error:', error);
            showMessage(error.message, 'error');
            return { data: null, error };
        } finally {
            showLoading(false);
        }
    }

    // Sign in with Google OAuth
    async signInWithGoogle() {
        try {
            showLoading(true);
            const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    scopes: 'openid email profile'
                }
            });

            if (error) throw error;
            
            // OAuth redirect will handle the rest
            return { data, error: null };
        } catch (error) {
            console.error('Google sign in error:', error);
            showMessage(error.message, 'error');
            showLoading(false);
            return { data: null, error };
        }
    }

    // Sign out
    async signOut() {
        try {
            showLoading(true);
            const { error } = await window.supabaseClient.auth.signOut();
            
            if (error) throw error;
            
            this.user = null;
            this.session = null;
            this.coursesLoaded = false;
            this.loadingCourses = false;
            showMessage('Logged out successfully!', 'success');
            this.updateUI();
            return { error: null };
        } catch (error) {
            console.error('Sign out error:', error);
            showMessage(error.message, 'error');
            return { error };
        } finally {
            showLoading(false);
        }
    }

    // Get current session
    async getCurrentSession() {
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) throw error;
            
            const previousUserId = this.user?.id;
            this.session = session;
            this.user = session?.user || null;
            
            // Only update UI if user actually changed (not just session refresh)
            const currentUserId = this.user?.id;
            if (previousUserId !== currentUserId) {
                this.updateUI();
            }
            
            return { session, error: null };
        } catch (error) {
            console.error('Get session error:', error);
            return { session: null, error };
        }
    }

    // Handle authentication state changes
    handleAuthChange(authData) {
        this.session = authData.session;
        this.user = authData.user;
        this.updateUI();
    }

    // Update UI based on authentication state
    updateUI() {
        console.log('🔄 updateUI called');
        
        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (this.user && this.session) {
            // User is authenticated
            authSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            this.displayUserInfo();
        } else {
            // User is not authenticated
            authSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
            // Reset course loading state when logging out
            this.coursesLoaded = false;
            this.loadingCourses = false;
        }
    }

    // Display user information in dashboard
    displayUserInfo() {
        console.log('🔄 displayUserInfo called');
        
        const userDetailsDiv = document.getElementById('user-details');
        if (!userDetailsDiv || !this.user) return;

        const userInfo = {
            email: this.user.email,
            provider: this.user.app_metadata?.provider || 'email',
            created: new Date(this.user.created_at).toLocaleDateString(),
            lastSignIn: new Date(this.user.last_sign_in_at).toLocaleDateString(),
            emailConfirmed: this.user.email_confirmed_at ? 'Yes' : 'No'
        };

        // Check if user profile section already exists to avoid re-rendering
        const existingUserDetails = userDetailsDiv.querySelector('.user-details');
        if (existingUserDetails) {
            // Only update if this is first time and courses section doesn't exist
            this.ensureCoursesSection();
            return;
        }

        console.log('🎯 First time rendering user profile');
        userDetailsDiv.innerHTML = `
            <div class="user-details">
                <h3>Your Profile</h3>
                <p><strong>Email:</strong> ${userInfo.email}</p>
                <p><strong>Sign-in Method:</strong> ${userInfo.provider}</p>
                <p><strong>Member Since:</strong> ${userInfo.created}</p>
                <p><strong>Last Sign In:</strong> ${userInfo.lastSignIn}</p>
                <p><strong>Email Verified:</strong> ${userInfo.emailConfirmed}</p>
                ${this.user.user_metadata?.full_name ? `<p><strong>Name:</strong> ${this.user.user_metadata.full_name}</p>` : ''}
                ${this.user.user_metadata?.avatar_url ? `<p><strong>Avatar:</strong> <img src="${this.user.user_metadata.avatar_url}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-left: 10px;"></p>` : ''}
            </div>
        `;

        // Add courses section after user profile
        this.ensureCoursesSection();
    }

    // Ensure courses section exists without re-rendering if already present
    ensureCoursesSection() {
        const userDetailsDiv = document.getElementById('user-details');
        if (!userDetailsDiv) return;

        let coursesSection = document.getElementById('user-courses');
        if (!coursesSection) {
            console.log('🎯 Creating courses section for first time');
            coursesSection = document.createElement('div');
            coursesSection.id = 'user-courses';
            coursesSection.className = 'user-courses';
            coursesSection.innerHTML = `
                <div class="courses-section">
                    <h3>Your Courses</h3>
                    <div class="loading-placeholder">Loading courses...</div>
                </div>
            `;
            userDetailsDiv.appendChild(coursesSection);
            
            // Load courses for the first time
            if (!this.coursesLoaded) {
                setTimeout(() => this.displayUserCourses(false), 100);
            }
        }
    }

    // Set up auth state listener
    setupAuthListener() {
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            
            this.session = session;
            this.user = session?.user || null;
            
            let shouldUpdateUI = false;
            
            switch (event) {
                case 'SIGNED_IN':
                    showMessage('Successfully signed in!', 'success');
                    shouldUpdateUI = true;
                    break;
                case 'SIGNED_OUT':
                    showMessage('Successfully signed out!', 'success');
                    shouldUpdateUI = true;
                    break;
                case 'TOKEN_REFRESHED':
                    console.log('Token refreshed - UI not updated');
                    // Don't update UI for token refresh - it's just background maintenance
                    break;
                case 'PASSWORD_RECOVERY':
                    showMessage('Password recovery email sent!', 'info');
                    break;
            }
            
            // Only update UI for significant auth changes, not token refresh
            if (shouldUpdateUI) {
                this.updateUI();
            }
        });
    }

    // Reset password
    async resetPassword(email) {
        try {
            showLoading(true);
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password'
            });

            if (error) throw error;
            
            showMessage('Password reset email sent! Check your inbox.', 'info');
            return { error: null };
        } catch (error) {
            console.error('Reset password error:', error);
            showMessage(error.message, 'error');
            return { error };
        } finally {
            showLoading(false);
        }
    }

    // Fetch user courses with course details
    async fetchUserCourses() {
        try {
            if (!this.user) {
                throw new Error('User not authenticated');
            }

            // Don't show global loading spinner - we have inline loading placeholder
            console.log('Fetching courses for user:', this.user.id);

            // Option 1: Using secure SQL function (respects RLS)
            //const { data, error } = await window.supabaseClient.rpc('get_my_courses');

            // Option 2: Using PostgREST API (if SQL function doesn't exist)
            const { data, error } = await window.supabaseClient
                .from('UserCourses')
                .select(`
                    course_id,
                    Courses!inner (
                        id,
                        name,
                        description,
                        created_at
                    )
                `)
                .eq('user_id', this.user.id);

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            console.error('Fetch user courses error:', error);
            showMessage(`Failed to load courses: ${error.message}`, 'error');
            return { data: null, error };
        }
        // Removed global loading spinner - using inline loading placeholder instead
    }

    // Alternative: Fetch using separate queries (more flexible)
    async fetchUserCoursesAlternative() {
        try {
            if (!this.user) {
                throw new Error('User not authenticated');
            }

            showLoading(true);
            console.log('Fetching courses for user:', this.user.id);

            // Method 3: Execute raw SQL using custom function
            const { data, error } = await window.supabaseClient.rpc('execute_sql', {
                sql_query: `
                    SELECT c.id, c.name, c.description, c.created_at, uc.created_at as enrolled_at
                    FROM "Courses" c 
                    INNER JOIN "UserCourses" uc ON c.id = uc.course_id
                    WHERE uc.user_id = $1
                    ORDER BY c.name
                `,
                parameters: [this.user.id]
            });

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            console.error('Fetch user courses error:', error);
            showMessage(`Failed to load courses: ${error.message}`, 'error');
            return { data: null, error };
        } finally {
            showLoading(false);
        }
    }

    // Add a course to user (example function)
    async addUserCourse(courseId) {
        try {
            if (!this.user) {
                throw new Error('User not authenticated');
            }

            showLoading(true);
            const { data, error } = await window.supabaseClient
                .from('UserCourses')
                .insert([
                    { user_id: this.user.id, course_id: courseId }
                ])
                .select();

            if (error) throw error;

            showMessage('Course added successfully!', 'success');
            // Refresh the courses display
            await this.displayUserCourses(true); // Force refresh after adding
            return { data, error: null };
        } catch (error) {
            console.error('Add user course error:', error);
            showMessage(`Failed to add course: ${error.message}`, 'error');
            return { data: null, error };
        } finally {
            showLoading(false);
        }
    }

    // Remove a course from user
    async removeUserCourse(courseId) {
        try {
            if (!this.user) {
                throw new Error('User not authenticated');
            }

            showLoading(true);
            const { error } = await window.supabaseClient
                .from('UserCourses')
                .delete()
                .eq('user_id', this.user.id)
                .eq('course_id', courseId);

            if (error) throw error;

            showMessage('Course removed successfully!', 'success');
            // Refresh the courses display
            await this.displayUserCourses(true); // Force refresh after removing
            return { error: null };
        } catch (error) {
            console.error('Remove user course error:', error);
            showMessage(`Failed to remove course: ${error.message}`, 'error');
            return { error };
        } finally {
            showLoading(false);
        }
    }

    // Display user courses in the dashboard
    async displayUserCourses(forceRefresh = false) {
        console.log('🔄 displayUserCourses called, forceRefresh:', forceRefresh, 'coursesLoaded:', this.coursesLoaded, 'loadingCourses:', this.loadingCourses);
        
        const coursesContainer = document.getElementById('user-courses');
        if (!coursesContainer) return;

        // Prevent duplicate calls
        if (this.loadingCourses) {
            console.log('⏳ Already loading courses, skipping');
            return;
        }

        // Check if courses are already loaded and we're not forcing a refresh
        if (!forceRefresh && this.coursesLoaded) {
            console.log('📋 Courses already loaded, skipping refresh');
            return;
        }

        this.loadingCourses = true;
        
        // Show loading in the courses section
        coursesContainer.innerHTML = `
            <div class="courses-section">
                <h3>Your Courses</h3>
                <div class="loading-placeholder">🔄 Loading courses...</div>
            </div>
        `;

        try {
            const { data: courses, error } = await this.fetchUserCourses();
        
            if (error || !courses) {
                coursesContainer.innerHTML = `
                    <div class="courses-section">
                        <h3>Your Courses</h3>
                        <p class="no-courses">Failed to load courses. Please try again.</p>
                    </div>
                `;
                this.coursesLoaded = true; // Mark as loaded even if failed to prevent retry loops
                return;
            }

            if (courses.length === 0) {
                coursesContainer.innerHTML = `
                    <div class="courses-section">
                        <h3>Your Courses</h3>
                        <p class="no-courses">You haven't enrolled in any courses yet.</p>
                    </div>
                `;
                this.coursesLoaded = true;
                return;
            }

        const coursesHtml = courses.map(courseData => {
            // Handle both SQL function format and PostgREST format
            const course = courseData.Courses || courseData; // SQL function returns flat objects, PostgREST returns nested
            if (!course) return '';
            
            return `
                <div class="course-card" data-course-id="${course.id}">
                    <div class="course-info">
                        <h4 class="course-name">${course.name}</h4>
                        ${course.description ? `<p class="course-description">${course.description}</p>` : ''}
                        <p class="course-meta">Added: ${new Date(course.created_at).toLocaleDateString()}</p>
                    </div>
                    <div class="course-actions">
                        <button class="btn btn-small btn-danger" onclick="authManager.removeUserCourse(${course.id})">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        coursesContainer.innerHTML = `
            <div class="courses-section">
                <h3>Your Courses (${courses.length})</h3>
                <div class="courses-grid">
                    ${coursesHtml}
                </div>
            </div>
        `;
        
            this.coursesLoaded = true;
        } catch (unexpectedError) {
            console.error('Unexpected error in displayUserCourses:', unexpectedError);
            coursesContainer.innerHTML = `
                <div class="courses-section">
                    <h3>Your Courses</h3>
                    <p class="no-courses">An unexpected error occurred. Please try again.</p>
                </div>
            `;
            this.coursesLoaded = true; // Mark as loaded to prevent retry loops
        } finally {
            this.loadingCourses = false;
        }
    }

    // Reset loading states (useful for debugging)
    resetCourseLoadingState() {
        console.log('🔄 Resetting course loading state');
        this.coursesLoaded = false;
        this.loadingCourses = false;
    }
}

// Create global auth manager instance
const authManager = new AuthManager();