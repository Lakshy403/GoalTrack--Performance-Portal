import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import useAuthStore from '@/store/authStore';
import { authService } from '@/services/api';
import { getInitials } from '@/lib/utils';
import { Building2, Camera, IdCard, Lock, Mail, Save, ShieldCheck, UserRound, Users, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, refreshProfile } = useAuthStore();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: user?.firstName || user?.name?.split(' ')[0] || '',
    lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleProfileSave = async () => {
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      addToast({ title: 'Missing profile details', description: 'Name and email are required.', variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await authService.updateProfile(profile);
      await refreshProfile();
      addToast({ title: 'Profile Updated', description: 'Your profile changes were saved.', variant: 'success' });
    } catch (err) {
      addToast({ title: 'Update Failed', description: err.response?.data?.error || 'Could not save profile.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      addToast({ title: 'Missing password fields', description: 'Fill all password fields before saving.', variant: 'warning' });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      addToast({ title: 'Passwords do not match', description: 'Confirm password must match the new password.', variant: 'warning' });
      return;
    }
    setPasswordSaving(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      addToast({ title: 'Password Changed', description: 'Use the new password on your next login.', variant: 'success' });
    } catch (err) {
      addToast({ title: 'Password Update Failed', description: err.response?.data?.error || 'Could not update password.', variant: 'error' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-5">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl">{getInitials(user?.name || 'Employee')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-sm text-[hsl(var(--color-muted-foreground))]">{user?.designation} · {user?.department}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[hsl(var(--color-muted-foreground))]">
              <span className="inline-flex items-center gap-1"><IdCard className="h-3.5 w-3.5" /> {user?.employeeCode}</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {user?.managerName || 'No manager assigned'}</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> {user?.role}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" /> Profile Details</CardTitle>
            <CardDescription>Keep your employee profile and contact details current.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First Name" value={profile.firstName} onChange={(v) => setProfile(p => ({ ...p, firstName: v }))} />
              <Field label="Last Name" value={profile.lastName} onChange={(v) => setProfile(p => ({ ...p, lastName: v }))} />
              <Field label="Email" type="email" icon={Mail} value={profile.email} onChange={(v) => setProfile(p => ({ ...p, email: v }))} />
              <Field label="Phone" value={profile.phone} onChange={(v) => setProfile(p => ({ ...p, phone: v }))} />
              <Field label="Avatar URL" icon={Camera} value={profile.avatar} onChange={(v) => setProfile(p => ({ ...p, avatar: v }))} />
              <ReadOnly label="Department" icon={Building2} value={user?.department} />
              <ReadOnly label="Employee ID" icon={IdCard} value={user?.employeeCode} />
              <ReadOnly label="Reporting Manager" icon={Users} value={user?.managerName || 'Unassigned'} />
            </div>
            <Button onClick={handleProfileSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Password</CardTitle>
            <CardDescription>Change your portal password securely.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Current Password" type="password" value={passwords.currentPassword} onChange={(v) => setPasswords(p => ({ ...p, currentPassword: v }))} />
            <Field label="New Password" type="password" value={passwords.newPassword} onChange={(v) => setPasswords(p => ({ ...p, newPassword: v }))} />
            <Field label="Confirm Password" type="password" value={passwords.confirmPassword} onChange={(v) => setPasswords(p => ({ ...p, confirmPassword: v }))} />
            <Button className="w-full" variant="outline" onClick={handlePasswordSave} disabled={passwordSaving}>
              {passwordSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', icon: Icon }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />}
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={Icon ? 'pl-9' : ''} />
      </div>
    </div>
  );
}

function ReadOnly({ label, value, icon: Icon }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-md border border-teal-100/60 dark:border-slate-700 bg-gradient-to-r from-white/40 to-emerald-50/20 dark:from-slate-800/30 dark:to-slate-800/20 px-3 py-2 text-sm min-h-10">
        {Icon && <Icon className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />}
        <span>{value || 'N/A'}</span>
      </div>
    </div>
  );
}
