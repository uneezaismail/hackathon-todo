# Environment Variables Setup Guide

## Overview

This guide explains all environment variables required for deploying the Todo application to Kubernetes with Minikube. Follow the steps below to properly configure your deployment.

## Table of Contents

1. [Quick Setup](#quick-setup)
2. [Required Variables](#required-variables)
3. [Optional Variables](#optional-variables)
4. [LLM Provider Selection](#llm-provider-selection)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Quick Setup

### 1. Copy the Template

```bash
cd phase-4-k8s-deployment
cp .env.example .env
```

### 2. Edit the File

```bash
# Use your preferred editor
nano .env
# OR
vim .env
# OR
code .env
```

### 3. Fill Required Values

At minimum, you must set:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - JWT signing secret (32+ characters)
- `OPENAI_API_KEY` - Or another LLM provider key

---

## Required Variables

### 1. DATABASE_URL

**Purpose**: Connection string for Neon Serverless PostgreSQL database

**How to Get**:
1. Go to [Neon Console](https://console.neon.tech/)
2. Sign in or create account (free tier available)
3. Create a new project or select existing
4. Navigate to "Connection Details"
5. Copy the connection string

**Format**:
```bash
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Example**:
```bash
DATABASE_URL=postgresql://myuser:mypassword@ep-cool-lake-123456.us-east-1.aws.neon.tech/todo_db?sslmode=require
```

**Important Notes**:
- ✅ MUST include `?sslmode=require` at the end
- ✅ Use the **pooled connection string** (not direct) for better performance
- ⚠️ Never commit this to Git (it contains your password)
- ℹ️ Frontend and backend both need database access

**Where It's Used**:
- Backend: Database operations (tasks, conversations, messages)
- Frontend: Better Auth user/session tables

---

### 2. BETTER_AUTH_SECRET

**Purpose**: Secret key for signing and verifying JWT authentication tokens

**How to Generate**:
```bash
openssl rand -base64 32
```

**Example Output**:
```
aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/=
```

**Format**:
```bash
BETTER_AUTH_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/=
```

**Important Notes**:
- ✅ MUST be at least 32 characters long
- ✅ MUST be the same value in frontend and backend
- ⚠️ CRITICAL for security - keep secret!
- ⚠️ Changing this invalidates all existing user sessions
- ℹ️ Used for JWT token signing/verification

**Where It's Used**:
- Frontend: Signing JWTs when users log in
- Backend: Verifying JWTs on every API request

**What Happens If It's Wrong**:
- Frontend uses `secret-A`, Backend uses `secret-B` → All API requests fail with 401 Unauthorized
- Users cannot log in or access protected features

---

### 3. LLM API Key (Choose One Provider)

You must configure **at least one** LLM provider for the AI chatbot to work.

#### Option 1: OpenAI (Recommended for Quality)

**How to Get**:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

**Format**:
```bash
OPENAI_API_KEY=sk-proj-...your-actual-key-here...
```

**Cost**: Pay-as-you-go (~$0.001 per request for gpt-4o-mini)

**Best For**: Production, high-quality responses

---

#### Option 2: Gemini (Google)

**How to Get**:
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with Google account
3. Click "Get API Key"
4. Create API key
5. Copy the key (starts with `AIza`)

**Format**:
```bash
GEMINI_API_KEY=AIza...your-actual-key-here...
```

**Cost**: Free tier available, then pay-as-you-go

**Best For**: Cost optimization, competitive quality

---

#### Option 3: Groq (Fast & Free Tier)

**How to Get**:
1. Go to [Groq Console](https://console.groq.com/)
2. Sign up for account
3. Navigate to API Keys
4. Create new key
5. Copy the key (starts with `gsk_`)

**Format**:
```bash
GROQ_API_KEY=gsk_...your-actual-key-here...
```

**Cost**: Generous free tier, fastest inference

**Best For**: Development, testing, speed-critical applications

---

#### Option 4: OpenRouter (Multi-Model Access)

**How to Get**:
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for account
3. Go to Keys section
4. Create API key
5. Copy the key (starts with `sk-or-v1-`)

**Format**:
```bash
OPENROUTER_API_KEY=sk-or-v1-...your-actual-key-here...
```

**Cost**: Some models are free (e.g., `openai/gpt-oss-20b:free`)

**Best For**: Access to multiple models, free tier testing

---

## Optional Variables

### Cloudflare R2 Storage (File Uploads)

**Only required if you want users to upload files/attachments to tasks.**

**How to Get**:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create a bucket
4. Generate API token with R2 permissions

**Format**:
```bash
CLOUDFLARE_R2_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET_NAME=todo-app-uploads
```

**Where It's Used**:
- Backend: Uploading/retrieving task attachments

**What Happens If Not Set**:
- File upload features will be disabled
- Tasks can still be created/managed (just no attachments)

---

## LLM Provider Selection

### How the Application Chooses Which Provider to Use

The backend automatically detects which LLM provider to use based on which environment variable is set:

**Priority Order**:
1. If `OPENAI_API_KEY` is set → Uses OpenAI (gpt-4o-mini)
2. Else if `GEMINI_API_KEY` is set → Uses Gemini (gemini-2.5-flash)
3. Else if `GROQ_API_KEY` is set → Uses Groq (llama-3.3-70b-versatile)
4. Else if `OPENROUTER_API_KEY` is set → Uses OpenRouter

**To Switch Providers**:
```bash
# Currently using OpenAI, want to switch to Groq

# Option 1: Comment out OpenAI, uncomment Groq
# OPENAI_API_KEY=sk-...  # Commented out
GROQ_API_KEY=gsk-...

# Option 2: Remove OpenAI, set Groq
# Just delete OPENAI_API_KEY line, add GROQ_API_KEY
```

**Cost Comparison**:

| Provider | Model | Cost per 1M Tokens | Speed | Quality |
|----------|-------|-------------------|-------|---------|
| OpenAI | gpt-4o-mini | ~$0.15 | Medium | Excellent |
| Gemini | gemini-2.5-flash | ~$0.075 | Medium | Very Good |
| Groq | llama-3.3-70b | Free tier | **Very Fast** | Good |
| OpenRouter | Various | Free/Paid | Varies | Varies |

**Recommendation**:
- **Development**: Groq (free, fast)
- **Production**: OpenAI or Gemini (better quality)
- **Cost-Conscious**: Gemini (half the price of OpenAI)

---

## Security Best Practices

### ⚠️ NEVER Commit .env to Git

The `.env` file contains sensitive secrets. Always verify it's in `.gitignore`:

```bash
# Check if .env is ignored
git check-ignore .env

# Expected output: .env
# If no output, add to .gitignore
echo ".env" >> .gitignore
```

### ✅ Use Strong Secrets

**Good** BETTER_AUTH_SECRET:
```bash
BETTER_AUTH_SECRET=X9k3mP2nR7vL5qW8tY4jH6sN1aF3dG9bC0eZ5xQ2wE8uI7oA6
```

**Bad** BETTER_AUTH_SECRET:
```bash
BETTER_AUTH_SECRET=mysecret123  # TOO SHORT!
BETTER_AUTH_SECRET=password     # PREDICTABLE!
```

### 🔒 Rotate Secrets Regularly

**When to Rotate**:
- Every 90 days (production)
- If you suspect compromise
- When team members leave

**How to Rotate DATABASE_URL**:
1. Create new database or reset password in Neon
2. Update `.env` with new connection string
3. Redeploy: `./scripts/deploy.sh`

**How to Rotate BETTER_AUTH_SECRET**:
1. Generate new secret: `openssl rand -base64 32`
2. Update `.env` with new secret
3. Redeploy: `./scripts/deploy.sh`
4. ⚠️ **All users will be logged out** (need to sign in again)

### 📋 Environment File Checklist

Before deploying, verify:
- [ ] `.env` file created from `.env.example`
- [ ] `DATABASE_URL` set with valid Neon connection string
- [ ] `DATABASE_URL` includes `?sslmode=require`
- [ ] `BETTER_AUTH_SECRET` is at least 32 characters
- [ ] At least one LLM API key is set
- [ ] `.env` is in `.gitignore`
- [ ] No spaces around `=` signs (e.g., `KEY=value` not `KEY = value`)
- [ ] No quotes around values (unless value contains spaces)

---

## Troubleshooting

### Problem: "DATABASE_URL is not set" Error

**Symptoms**:
```
Error: Missing required environment variable: DATABASE_URL
```

**Solution**:
```bash
# 1. Check if .env exists
ls -la .env

# 2. Check if DATABASE_URL is set in .env
grep DATABASE_URL .env

# 3. Verify no typos (e.g., DATABASE_ULR instead of DATABASE_URL)

# 4. Source the .env file
source .env

# 5. Verify it's loaded
echo $DATABASE_URL

# 6. Redeploy
./scripts/deploy.sh
```

---

### Problem: Backend Pods Crash with "Invalid JWT Secret"

**Symptoms**:
```
JWT verification failed: Invalid signature
```

**Root Cause**: Frontend and backend have different `BETTER_AUTH_SECRET` values

**Solution**:
```bash
# 1. Check frontend secret
kubectl get secret -n todo-app todo-app-secrets -o jsonpath='{.data.BETTER_AUTH_SECRET}' | base64 -d

# 2. Check your .env file
cat .env | grep BETTER_AUTH_SECRET

# 3. Ensure they match

# 4. If they don't match, fix .env and redeploy
source .env
./scripts/deploy.sh
```

---

### Problem: AI Chatbot Not Working

**Symptoms**:
- Chatbot loads but shows "AI service unavailable"
- Backend logs show "OpenAI API key not found"

**Solution**:
```bash
# 1. Check which LLM provider key is set
grep -E "(OPENAI|GEMINI|GROQ|OPENROUTER)_API_KEY" .env

# 2. Verify the key is valid
# For OpenAI: Key should start with "sk-"
# For Gemini: Key should start with "AIza"
# For Groq: Key should start with "gsk_"

# 3. Test the key manually (OpenAI example)
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Expected: JSON response with model list
# Error: {"error": {"message": "Incorrect API key"}}

# 4. If key is invalid, generate new one and update .env

# 5. Redeploy
source .env
./scripts/deploy.sh
```

---

### Problem: Database Connection Timeout

**Symptoms**:
```
TimeoutError: Connection to database timed out
```

**Solution**:
```bash
# 1. Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host/db?sslmode=require

# 2. Test connection from local machine
docker run --rm postgres:15 psql "$DATABASE_URL" -c "SELECT 1"

# Expected: "1" output
# Error: Check if database exists and credentials are correct

# 3. Verify Minikube can reach database (firewall/allowlist)
minikube ip
# Add this IP to Neon database allowlist (if restricted)

# 4. Check if ?sslmode=require is present
# Neon requires SSL, missing this parameter causes connection failures
```

---

### Problem: Secrets Not Injected in Pods

**Symptoms**:
```bash
kubectl exec -n todo-app <pod-name> -- env | grep DATABASE_URL
# No output (secret missing)
```

**Solution**:
```bash
# 1. Check if secret exists
kubectl get secret -n todo-app todo-app-secrets

# 2. Verify secret has correct keys
kubectl describe secret -n todo-app todo-app-secrets

# Expected keys: DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, etc.

# 3. If secret is missing, verify .env is sourced before deployment
source .env
echo $DATABASE_URL  # Should print value

# 4. Redeploy (script uses --set to inject secrets)
./scripts/deploy.sh

# 5. Verify secret is now in pod
kubectl exec -n todo-app <pod-name> -- env | grep DATABASE_URL
```

---

## Deployment Workflow

### Complete Setup Process

```bash
# 1. Navigate to deployment directory
cd phase-4-k8s-deployment

# 2. Copy environment template
cp .env.example .env

# 3. Edit with your values
nano .env  # or vim, code, etc.

# 4. Verify required variables are set
cat .env
# Check: DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY

# 5. Source environment variables
source .env

# 6. Verify they're loaded
echo $DATABASE_URL
echo $BETTER_AUTH_SECRET
echo $OPENAI_API_KEY

# 7. Deploy
./scripts/deploy.sh

# 8. Wait for pods to be ready
kubectl get pods -n todo-app -w

# 9. Access application
minikube ip
# Open browser: http://<minikube-ip>:30300
```

---

## Environment Variable Reference

### Complete List

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection | `postgresql://user:pass@host/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | ✅ Yes | JWT signing secret | `aBcD...32+ chars` |
| `OPENAI_API_KEY` | ⚠️ One LLM | OpenAI API access | `sk-proj-...` |
| `GEMINI_API_KEY` | ⚠️ One LLM | Google AI access | `AIza...` |
| `GROQ_API_KEY` | ⚠️ One LLM | Groq API access | `gsk_...` |
| `OPENROUTER_API_KEY` | ⚠️ One LLM | OpenRouter access | `sk-or-v1-...` |
| `CLOUDFLARE_R2_ACCOUNT_ID` | ❌ No | R2 storage account | `abc123...` |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | ❌ No | R2 access key | `xyz789...` |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | ❌ No | R2 secret key | `secret123...` |
| `CLOUDFLARE_R2_BUCKET_NAME` | ❌ No | R2 bucket name | `todo-uploads` |

### Where Secrets Are Stored

**Local Development**:
- File: `phase-4-k8s-deployment/.env`
- Security: File permissions (chmod 600)

**Kubernetes Deployment**:
- Resource: Kubernetes Secret (`todo-app-secrets`)
- Encoding: Base64 (not encryption!)
- Injection: Via `secretKeyRef` in pod environment

**Viewing Kubernetes Secrets**:
```bash
# List secrets
kubectl get secrets -n todo-app

# View secret (base64 encoded)
kubectl get secret -n todo-app todo-app-secrets -o yaml

# Decode specific value
kubectl get secret -n todo-app todo-app-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d
```

---

## Next Steps

After setting up environment variables:

1. **Test Local Build** (Optional):
   ```bash
   eval $(minikube docker-env)
   docker build -t todo-frontend:latest ./frontend
   docker build -t todo-backend:latest ./backend
   ```

2. **Deploy to Minikube**:
   ```bash
   ./scripts/deploy.sh
   ```

3. **Verify Deployment**:
   ```bash
   kubectl get pods -n todo-app
   kubectl logs -n todo-app -l app.kubernetes.io/name=todo-app
   ```

4. **Access Application**:
   ```bash
   echo "Frontend: http://$(minikube ip):30300"
   ```

5. **Test AI Chatbot**:
   - Sign up/Login
   - Open chat widget (floating button)
   - Send: "Add a task to buy groceries"
   - Verify AI responds and creates task

---

## Support

For environment setup issues:
- Check [Troubleshooting Guide](./troubleshooting.md)
- Review [Deployment README](../README.md)
- Verify [Quickstart Guide](../../specs/009-minikube-helm-deployment/quickstart.md)

For security concerns:
- Never commit `.env` to version control
- Rotate secrets regularly
- Use strong, random secrets (minimum 32 characters)
- Add Minikube IP to database firewall allowlist
