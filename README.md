# Supabase Authentication Demo

A complete frontend-only application demonstrating Supabase authentication with both email/password and Google OAuth integration.

## 🚀 Features

- **Email Authentication**: Sign up and login with email and password
- **Google OAuth**: One-click authentication with Google
- **Session Management**: Automatic session persistence and renewal
- **User Dashboard**: Display user profile information
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live authentication state changes
- **Password Validation**: Client-side form validation
- **Error Handling**: Comprehensive error messages and loading states

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Web Browser**: Modern browser with JavaScript enabled
3. **Local Web Server**: To serve the files (due to CORS restrictions)

## 🛠️ Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created (2-3 minutes)

### Step 2: Get Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://your-project.supabase.co`)
   - **Anon (public) key** (starts with `eyJ...`)

### Step 3: Configure Google OAuth (Optional)

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and toggle it on
3. You'll need to set up Google OAuth credentials:
   
   **Create Google OAuth App:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable **Google Identity** API (or ensure Google OAuth2 is available)
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
   - Copy **Client ID** and **Client Secret**
   
4. Back in Supabase, enter your Google OAuth credentials
5. Save the configuration

### Step 4: Set Up Database Tables (Optional)

If you want to test the courses feature, create these tables in your Supabase database:

1. In your Supabase dashboard, go to **Table Editor**
2. Create the **Courses** table:
   ```sql
   CREATE TABLE Courses (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     description TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. Create the **UserCourses** table:
   ```sql
   CREATE TABLE UserCourses (
     id SERIAL PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     course_id INTEGER REFERENCES Courses(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, course_id)
   );
   ```

4. Insert some sample courses:
   ```sql
   INSERT INTO Courses (name, description) VALUES
   ('JavaScript Fundamentals', 'Learn the basics of JavaScript programming'),
   ('React for Beginners', 'Build modern web applications with React'),
   ('Node.js Backend Development', 'Create server-side applications with Node.js');
   ```

5. Set up Row Level Security (RLS):
   ```sql
   -- Enable RLS on UserCourses table
   ALTER TABLE UserCourses ENABLE ROW LEVEL SECURITY;
   
   -- Enable RLS on Courses table
   ALTER TABLE Courses ENABLE ROW LEVEL SECURITY;
   
   -- UserCourses policies - users can only access their own course enrollments
   CREATE POLICY "Users can view their own courses" ON UserCourses
     FOR SELECT USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert their own courses" ON UserCourses
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   
   CREATE POLICY "Users can delete their own courses" ON UserCourses
     FOR DELETE USING (auth.uid() = user_id);
   
   -- Courses policies - all authenticated users can read course information
   CREATE POLICY "Authenticated users can view all courses" ON Courses
     FOR SELECT USING (auth.role() = 'authenticated');
   
   -- Optional: Allow authenticated users to create courses
   CREATE POLICY "Authenticated users can create courses" ON Courses
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   ```

6. **Create SQL Functions for Raw SQL Queries (Optional):**

   **Option A: Secure function that respects RLS (Recommended)**
   ```sql
   CREATE OR REPLACE FUNCTION get_user_courses(p_user_id UUID DEFAULT NULL)
   RETURNS TABLE (
     id INTEGER,
     name VARCHAR(255),
     description TEXT,
     created_at TIMESTAMPTZ,
     enrolled_at TIMESTAMPTZ
   )
   LANGUAGE SQL
   SECURITY INVOKER  -- Uses caller's permissions, respects RLS
   AS $$
     SELECT 
       c.id, 
       c.name, 
       c.description, 
       c.created_at,
       uc.created_at as enrolled_at
     FROM "Courses" c 
     INNER JOIN "UserCourses" uc ON c.id = uc.course_id
     WHERE uc.user_id = COALESCE(p_user_id, auth.uid())  -- Use auth.uid() if no parameter
     ORDER BY c.name;
   $$;
   ```

   **Option B: Function that uses current user context (Most Secure)**
   ```sql
   CREATE OR REPLACE FUNCTION get_my_courses()
   RETURNS TABLE (
     id INTEGER,
     name VARCHAR(255),
     description TEXT,
     created_at TIMESTAMPTZ,
     enrolled_at TIMESTAMPTZ
   )
   LANGUAGE SQL
   SECURITY INVOKER  -- Respects RLS policies
   AS $$
     SELECT 
       c.id, 
       c.name, 
       c.description, 
       c.created_at,
       uc.created_at as enrolled_at
     FROM "Courses" c 
     INNER JOIN "UserCourses" uc ON c.id = uc.course_id
     WHERE uc.user_id = auth.uid()  -- Always uses authenticated user
     ORDER BY c.name;
   $$;
   ```

   **Option B: Generic SQL execution function (Advanced)**
   ```sql
   CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT, parameters JSONB DEFAULT '[]')
   RETURNS JSONB
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     result JSONB;
   BEGIN
     -- This is a simplified example - in production, you'd want more security
     -- and parameter binding
     EXECUTE sql_query INTO result;
     RETURN result;
   END;
   $$;
   ```

   **Option C: Simple user courses with security context**
   ```sql
   CREATE OR REPLACE FUNCTION get_my_courses()
   RETURNS TABLE (
     id INTEGER,
     name VARCHAR(255),
     description TEXT,
     created_at TIMESTAMPTZ,
     enrolled_at TIMESTAMPTZ
   )
   LANGUAGE SQL
   SECURITY DEFINER
   AS $$
     SELECT 
       c.id, 
       c.name, 
       c.description, 
       c.created_at,
       uc.created_at as enrolled_at
     FROM "Courses" c 
     INNER JOIN "UserCourses" uc ON c.id = uc.course_id
     WHERE uc.user_id = auth.uid()
     ORDER BY c.name;
   $$;
   ```

### Step 5: Configure the App

1. Open `js/config.js` in your code editor
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### Step 6: Serve the Application

You need to serve the files through a web server (not file://) due to CORS restrictions.

**Option 1: Using Python (if installed)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option 2: Using Node.js (if installed)**
```bash
npx serve .
# or
npx http-server
```

**Option 3: Using PHP (if installed)**
```bash
php -S localhost:8000
```

**Option 4: Using VS Code Live Server**
- Install "Live Server" extension
- Right-click on `index.html`
- Select "Open with Live Server"

### Step 7: Test the Application

1. Open your browser and navigate to `http://localhost:8000` (or your server URL)
2. Try creating an account with email
3. Check your email for confirmation (if email confirmation is enabled)
4. Test Google sign-in
5. Verify that session persists on page refresh

## 📁 Project Structure

```
supabase-auth/
├── index.html          # Main HTML file with forms and dashboard
├── css/
│   └── styles.css      # Complete styling for the app
├── js/
│   ├── config.js       # Supabase configuration
│   ├── auth.js         # Authentication logic and Supabase integration
│   └── app.js          # Main application logic and event handlers
└── README.md           # This file
```

## 🔧 Configuration Options

### Email Settings

In your Supabase dashboard under **Authentication** → **Settings**:

- **Enable email confirmations**: Require users to confirm their email
- **Email templates**: Customize confirmation and recovery emails
- **Redirect URLs**: Set allowed redirect URLs for email links

### Security Settings

- **JWT expiry**: Configure session duration
- **Refresh token rotation**: Enhanced security for tokens
- **Rate limiting**: Prevent abuse with rate limits

## 🎯 Usage Examples

### Email Authentication

```javascript
// Sign up
const { data, error } = await authManager.signUp('user@example.com', 'password123');

// Sign in
const { data, error } = await authManager.signIn('user@example.com', 'password123');

// Sign out
await authManager.signOut();
```

### Google OAuth

```javascript
// Sign in with Google
await authManager.signInWithGoogle();
```

### Session Management

```javascript
// Get current session
const { session, error } = await authManager.getCurrentSession();

// Listen for auth changes
authManager.setupAuthListener();
```

## 🎨 Customization

### Styling

Edit `css/styles.css` to customize the appearance:
- Colors and themes
- Layout and spacing
- Mobile responsiveness
- Animations and transitions

### Functionality

Extend the app by modifying:
- `js/auth.js`: Add new authentication methods
- `js/app.js`: Add new UI interactions
- `index.html`: Add new form fields or sections

## 🔍 Troubleshooting

### Common Issues

1. **"Please configure your Supabase credentials"**
   - Make sure you've updated `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/config.js`

2. **CORS Errors**
   - Serve the app through a web server, not file:// protocol
   - Use one of the server options mentioned above

3. **Google Sign-in Not Working**
   - Verify Google OAuth is enabled in Supabase
   - Check that redirect URIs are correctly configured
   - Ensure your domain is added to authorized origins

4. **Email Confirmation Not Received**
   - Check spam/junk folder
   - Verify email settings in Supabase dashboard
   - Try with a different email provider

5. **Session Not Persisting**
   - Check browser privacy settings
   - Ensure cookies are enabled
   - Try clearing browser cache

### Debug Mode

Enable debug logging by opening browser console. The app logs all authentication events and errors.

## 📚 Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signup)
- [Google OAuth Setup Guide](https://support.google.com/cloud/answer/6158849)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy coding!** 🎉

If you encounter any issues, please check the browser console for error messages and refer to the troubleshooting section above.