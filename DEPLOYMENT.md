# SendIT Application Deployment Guide

This guide will help you deploy the SendIT application to production using:

- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Neon (PostgreSQL)

## Prerequisites

1. **GitHub Account** with the SendIT repository
2. **Vercel Account** (free tier available)
3. **Render Account** (free tier available)
4. **Neon Account** (free tier available)
5. **Google Maps API Key** (already configured)

## Step 1: Set up Neon Database

### 1.1 Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create a new project

### 1.2 Get Database Connection String

1. In your Neon dashboard, go to "Connection Details"
2. Copy the connection string (it looks like: `postgresql://user:password@host/database`)
3. Save this for later use

## Step 2: Deploy Backend to Render

### 2.1 Connect GitHub Repository

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository: `Maxmillian-Muiruri/Send-IT`

### 2.2 Configure Web Service

- **Name**: `sendit-backend`
- **Root Directory**: `sendit-backend`
- **Environment**: `Node`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm run start:prod`

### 2.3 Set Environment Variables

Add these environment variables in Render:

```
NODE_ENV=production
DATABASE_URL=your_neon_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_MAPS_API_KEY=AIzaSyASNTztjeR-B1lQG2-mqOAuW_puDg_1Xeo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### 2.4 Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note the URL (e.g., `https://sendit-backend.onrender.com`)

## Step 3: Deploy Frontend to Vercel

### 3.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository: `Maxmillian-Muiruri/Send-IT`

### 3.2 Configure Project

- **Framework Preset**: `Angular`
- **Root Directory**: `sendit-frontend`
- **Build Command**: `npm run build:vercel`
- **Output Directory**: `dist/sendit-frontend`

### 3.3 Set Environment Variables

Add these environment variables in Vercel:

```
GOOGLE_MAPS_API_KEY=AIzaSyASNTztjeR-B1lQG2-mqOAuW_puDg_1Xeo
```

### 3.4 Update API URL

1. After backend deployment, update `sendit-frontend/src/environments/environment.prod.ts`
2. Change `apiUrl` to your Render backend URL
3. Redeploy frontend

### 3.5 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Note the URL (e.g., `https://sendit-frontend.vercel.app`)

## Step 4: Database Migration

### 4.1 Run Prisma Migrations

1. In your Render backend dashboard
2. Go to "Shell" tab
3. Run: `npx prisma migrate deploy`
4. Run: `npx prisma generate`

## Step 5: Test Deployment

### 5.1 Test Backend

- Visit: `https://your-backend-url.onrender.com`
- Should see: "Hello World!" or API documentation

### 5.2 Test Frontend

- Visit: `https://your-frontend-url.vercel.app`
- Should load the SendIT application

### 5.3 Test Features

1. **User Registration/Login**
2. **Parcel Creation**
3. **Parcel Tracking**
4. **Admin Dashboard**
5. **Courier Dashboard**

## Environment Variables Reference

### Backend (Render)

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET=your_secure_jwt_secret
GOOGLE_MAPS_API_KEY=AIzaSyASNTztjeR-B1lQG2-mqOAuW_puDg_1Xeo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### Frontend (Vercel)

```
GOOGLE_MAPS_API_KEY=AIzaSyASNTztjeR-B1lQG2-mqOAuW_puDg_1Xeo
```

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Check CORS configuration in `main.ts`
   - Ensure frontend URL is in allowed origins

2. **Database Connection Issues**

   - Verify DATABASE_URL is correct
   - Check if Neon database is active
   - Run migrations: `npx prisma migrate deploy`

3. **Build Failures**

   - Check build logs in Render/Vercel
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

4. **Environment Variables**
   - Double-check all environment variables are set
   - Ensure no typos in variable names
   - Restart services after changing variables

### Support

- **Render**: [docs.render.com](https://docs.render.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Neon**: [neon.tech/docs](https://neon.tech/docs)

## URLs After Deployment

- **Frontend**: `https://sendit-frontend.vercel.app`
- **Backend**: `https://sendit-backend.onrender.com`
- **Database**: Neon dashboard

## Next Steps

1. **Set up custom domain** (optional)
2. **Configure monitoring** and logging
3. **Set up CI/CD** for automatic deployments
4. **Configure backups** for database
5. **Set up SSL certificates** (usually automatic)
