import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from './AuthProvider';

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [oidcName, setOidcName] = useState('SSO');

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
      return;
    }
    fetch('/api/auth/config')
      .then(res => res.json())
      .then(data => setOidcName(data.oidcName))
      .catch(() => {});
  }, [user, navigate]);

  if (user) return null;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileText className="size-4" />
          </div>
          Invoice Manager
        </a>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>
              Sign in to manage your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => { window.location.href = '/api/auth/login'; }}
            >
              Sign in with {oidcName}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
