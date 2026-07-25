import { useCreateApplication, getListApplicationsQueryKey, getGetDashboardStatsQueryKey } from '@workspace/api-client-react';
import { Shell } from '@/components/layout/Shell';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  studentName: z.string().min(1, 'Student name is required'),
  company: z.string().min(1, 'Company is required'),
  driveDate: z.string().min(1, 'Drive date is required'),
  stage: z.enum(['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected']),
  offerStatus: z.enum(['Pending', 'Offered', 'Rejected', 'Withdrawn']),
  package: z.string().optional(),
  cgpa: z.string().optional(),
  branch: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewApplication() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateApplication();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: '',
      studentName: '',
      company: '',
      driveDate: new Date().toISOString().split('T')[0],
      stage: 'Applied',
      offerStatus: 'Pending',
      package: '',
      cgpa: '',
      branch: '',
      notes: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(
      {
        data: {
          studentId: values.studentId,
          studentName: values.studentName,
          company: values.company,
          driveDate: values.driveDate,
          stage: values.stage,
          offerStatus: values.offerStatus,
          package: values.package ? Number(values.package) : null,
          cgpa: values.cgpa ? Number(values.cgpa) : null,
          branch: values.branch || null,
          notes: values.notes || null,
        },
      },
      {
        onSuccess: (app) => {
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({ title: 'Application created', description: `Record for ${app.studentName} at ${app.company} saved.` });
          setLocation(`/applications/${app.id}`);
        },
        onError: () => {
          toast({ title: 'Error', description: 'Failed to create application. Please try again.', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <Shell>
      <div className="page-in px-6 py-5 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/applications"
            data-testid="btn-back"
            className="flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <div className="w-px h-4" style={{ backgroundColor: 'hsl(var(--border))' }} />
          <h1 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            New Application
          </h1>
        </div>

        <div
          className="rounded-lg border p-6"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', boxShadow: 'var(--shadow-xs)' }}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Student Info */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Student Information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Student ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 2021CS042" data-testid="input-student-id" className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Riya Deshmukh" data-testid="input-student-name" className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Branch</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Computer Science" data-testid="input-branch" className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cgpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">CGPA</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" min="0" max="10" placeholder="e.g. 8.47" data-testid="input-cgpa" className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t" style={{ borderColor: 'hsl(var(--border))' }} />

              {/* Drive Info */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Drive Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Company</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Infosys" data-testid="input-company" className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="driveDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Drive Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-drive-date" className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm" data-testid="select-stage">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'].map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="offerStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Offer Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm" data-testid="select-offer-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['Pending', 'Offered', 'Rejected', 'Withdrawn'].map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="package"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Package (LPA)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.1" min="0" placeholder="e.g. 12.5" data-testid="input-package" className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t" style={{ borderColor: 'hsl(var(--border))' }} />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Any additional notes about this application..." data-testid="input-notes" className="text-sm resize-none" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="btn-submit"
                  style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                >
                  {createMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                  Create Application
                </Button>
                <Link href="/applications">
                  <Button variant="ghost" type="button" data-testid="btn-cancel">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Shell>
  );
}
