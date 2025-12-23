import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CalendarIcon,
  ArrowLeft,
  Trophy,
  Users,
  DollarSign,
} from "lucide-react";

const createContestSchema = z.object({
  contestName: z
    .string()
    .min(1, "Contest name is required")
    .max(200, "Contest name too long"),

  categoryId: z.string().min(1, "Investment category is required"),
  contestType: z.enum(["classic", "eliminator"], {
    required_error: "Contest type is required",
  }),
  entryFee: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Entry fee must be a valid number",
    }),
  prizePool: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Prize pool must be a positive number",
    }),
  maxParticipants: z.string().optional(),
  openDate: z.string().min(1, "Open date is required"),
  closeDate: z.string().min(1, "Close date is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type CreateContestForm = z.infer<typeof createContestSchema>;

export default function CreateContest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<
    any[]
  >({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const form = useForm<CreateContestForm>({
    resolver: zodResolver(createContestSchema),
    defaultValues: {
      contestName: "",
      categoryId: "",
      contestType: "classic",
      entryFee: "0",
      prizePool: "1000",
      maxParticipants: "",
      openDate: "",
      closeDate: "",
      startDate: "",
      endDate: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateContestForm) => {
      console.log("Form data being submitted:", data);

      // Map contest type to mode ID
      const modeIdMap = {
        classic: 2, // Classic mode ID
        eliminator: 3, // Eliminator mode ID
      };

      const payload = {
        contestName: data.contestName,
        modeId: modeIdMap[data.contestType], // Map contest type to mode ID
        categoryId: parseInt(data.categoryId),
        contestType: data.contestType,
        entryFee: parseFloat(data.entryFee).toFixed(2), // Convert to string with 2 decimal places
        prizePool: parseFloat(data.prizePool).toFixed(2), // Convert to string with 2 decimal places
        maxParticipants: data.maxParticipants
          ? parseInt(data.maxParticipants)
          : undefined,
        openDate: new Date(data.openDate).toISOString(),
        closeDate: new Date(data.closeDate).toISOString(),
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        status: "open",
      };

      console.log("API payload being sent:", payload);

      const response = await apiRequest(
        "POST",
        "/api/contest-requests",
        payload
      );
      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error:", errorData);
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }
      return response.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contests"] });
      toast({
        title: "Success",
        description:
          "Contest request submitted for approval. You'll be notified when it's reviewed.",
      });
      setLocation("/contests"); // Redirect to contests list instead
    },
    onError: (error: any) => {
      console.error("Error creating contest:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to create contest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateContestForm) => {
    console.log("Form submitted with data:", data);
    console.log("Form validation errors:", form.formState.errors);
    createMutation.mutate(data);
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/contests")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Contest</h1>
            <p className="text-gray-600">
              Set up a new fantasy finance competition
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="contestName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contest Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contest name" {...field} />
                      </FormControl>
                      <FormDescription>
                        Give your contest a descriptive name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an investment category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose specific category rules and constraints
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contest Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contest type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="classic">
                              Classic - App-wide competition
                            </SelectItem>
                            <SelectItem value="eliminator">
                              Eliminator - Small group eliminations
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the competition format
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Fee ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Cost to join the contest
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prizePool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prize Pool ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="1000.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Total prize money</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Participants</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="2"
                            placeholder="Optional"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for unlimited
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="openDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Opens</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormDescription>
                          When participants can start joining
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="closeDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Closes</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormDescription>
                          Last chance to join and submit allocations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contest Starts</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormDescription>
                          When the trading period begins
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contest Ends</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormDescription>
                          When the trading period ends
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/contests")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Contest"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
