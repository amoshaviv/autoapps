"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
  Collapse,
  Container,
  Paper,
  Divider,
  Chip,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { Mail as GoogleIcon } from 'lucide-react';
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface InviteData {
  email: string;
  role: string;
  token: string;
  organization: {
    name: string;
    slug: string;
    domain: string;
    profileImageURL?: string;
  };
  invitedBy: {
    displayName: string;
    email: string;
    profileImageURL: string;
  };
}

interface InviteSignupClientProps {
  invite: InviteData;
}

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  user: "User",
};

const roleColors = {
  owner: "error" as const,
  admin: "warning" as const,
  user: "primary" as const,
};

export default function InviteSignupClient({ invite }: InviteSignupClientProps) {
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeProvider, setActiveProvider] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const router = useRouter();



  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setActiveProvider("google");
    setError("");
    try {
      document.cookie = `inviteToken=${invite.token}; path=/; max-age=600; SameSite=Lax`;

      await signIn("google", {
        callbackUrl: `/${invite.organization.slug}`,
      });
    } catch (error) {
      setIsLoading(false);
      setActiveProvider(null);
      setError("An error occurred during Google sign up");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Use NextAuth signIn with invite token
      const result = await signIn("credentials", {
        email: invite.email,
        displayName: displayName.trim(),
        password: password,
        inviteToken: invite.token,
        redirect: false,
      });

      if (result?.ok) {
        // Successfully signed up and signed in, redirect to organization apps page
        router.push(`/${invite.organization.slug}`);
      } else {
        setIsLoading(false);
        setError(result?.error || "Failed to create account");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error creating account:", error);
      setError("An error occurred while creating your account");
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email ? email[0].toUpperCase() : '?';
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <Grid
          justifyContent="center"
          alignItems="center"
          textAlign="center"
          sx={{ pt: 4 }}
          size={12}
        >
          <img
            alt="Application"
            src="/logo.png"
            style={{ height: 64, width: 64 }}
          />
        </Grid>

        <CardContent sx={{ p: 4 }}>
          {/* Invitation Details */}
          <Card variant="outlined" sx={{ mb: 4, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar src={invite.organization.profileImageURL} sx={{ mr: 2, bgcolor: 'primary.main' }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Join {invite.organization.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {invite.organization.domain}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar src={invite.invitedBy.profileImageURL} sx={{ mr: 2, width: 32, height: 32 }} />
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  Invited by {invite.invitedBy.displayName || invite.invitedBy.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {invite.invitedBy.email}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">Your role:</Typography>
              <Chip
                label={roleLabels[invite.role as keyof typeof roleLabels] || invite.role}
                color={roleColors[invite.role as keyof typeof roleColors] || "default"}
                size="small"
              />
            </Box>
          </Card>

          {/* Signup Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* OAuth Buttons */}


            <Collapse in={activeProvider === null || activeProvider === "google"} timeout={300}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                startIcon={activeProvider === "google" ? <CircularProgress size={18} /> : <GoogleIcon />}
                sx={{
                  py: 1.5,
                  mb: 3,
                  borderColor: "grey.300",
                  color: "text.primary",
                  "&:hover": {
                    borderColor: "grey.400",
                    backgroundColor: "grey.50",
                    color: "black"
                  },
                }}
              >
                {activeProvider === "google" ? "Connecting to Google..." : "Continue with Google"}
              </Button>
            </Collapse>

            {/* <Box sx={{ display: "flex", alignItems: "center", my: 3 }}>
              <Divider sx={{ flexGrow: 1 }} />
              <Typography variant="body2" sx={{ mx: 2, color: "text.secondary" }}>
                or
              </Typography>
              <Divider sx={{ flexGrow: 1 }} />
            </Box> */}

            <TextField
              fullWidth
              label="Email Address"
              value={invite.email}
              disabled
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
              helperText="This email address is associated with your invitation"
            />

            {/* <TextField
              fullWidth
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 3 }}
              helperText="Your name as it will appear to other users"
              required
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 3 }}
              helperText="Must be at least 8 characters"
              required
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 4 }}
              helperText="Enter the same password to confirm"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mb: 2 }}
            >
              {isLoading ? "Creating Account..." : "Create Account & Join Organization"}
            </Button> */}

            <Typography variant="body2" color="text.secondary" align="center">
              By creating an account, you&apos;ll be automatically added to {invite.organization.name} with {roleLabels[invite.role as keyof typeof roleLabels]} permissions.
            </Typography>
          </form>
        </CardContent>
      </Paper>
    </Container>
  );
}