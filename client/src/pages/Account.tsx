import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  User,
  History,
  Plus,
  Minus,
  Upload,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { LocalFileUploader } from "@/components/LocalFileUploader";

// Form schemas
const addFundsSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
});

const withdrawFundsSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
});

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  profileImageUrl: z.string().optional(),
});

export default function Account() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user balance
  const { data: balance, isLoading: isBalanceLoading } = useQuery({
    queryKey: ["/api/user/balance"],
    enabled: !!user,
  });

  // Fetch user transactions
  const { data: transactions = [], isLoading: isTransactionsLoading } =
    useQuery({
      queryKey: ["/api/user/transactions"],
      enabled: !!user,
    });

  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async (data: { amount: string }) => {
      return await apiRequest("POST", "/api/user/add-funds", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
      toast({
        title: "Success",
        description: "Funds added successfully",
      });
      addFundsForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Withdraw funds mutation
  const withdrawFundsMutation = useMutation({
    mutationFn: async (data: { amount: string }) => {
      return await apiRequest("POST", "/api/user/withdraw-funds", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
      toast({
        title: "Success",
        description: "Funds withdrawn successfully",
      });
      withdrawFundsForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      email: string;
      profileImageUrl?: string;
    }) => {
      return await apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form hooks
  const addFundsForm = useForm({
    resolver: zodResolver(addFundsSchema),
    defaultValues: { amount: "" },
  });

  const withdrawFundsForm = useForm({
    resolver: zodResolver(withdrawFundsSchema),
    defaultValues: { amount: "" },
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      profileImageUrl: "",
    },
  });

  // Update form defaults when user data loads
  useEffect(() => {
    if (user && !profileForm.formState.isDirty) {
      profileForm.reset({
        firstName: (user as any)?.firstName || "",
        lastName: (user as any)?.lastName || "",
        email: (user as any)?.email || "",
        profileImageUrl: (user as any)?.profileImageUrl || "",
      });
    }
  }, [user, profileForm]);

  const handleAddFunds = (data: z.infer<typeof addFundsSchema>) => {
    addFundsMutation.mutate(data);
  };

  const handleWithdrawFunds = (data: z.infer<typeof withdrawFundsSchema>) => {
    withdrawFundsMutation.mutate(data);
  };

  const handleUpdateProfile = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarUpload = (fileUrl: string) => {
    profileForm.setValue("profileImageUrl", fileUrl, { shouldDirty: true });
    toast({
      title: "Avatar uploaded",
      description: "Don't forget to save your profile to apply the changes",
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case "entry_fee":
        return "Contest Entry Fee";
      case "prize_payout":
        return "Prize Payout";
      case "admin_cut":
        return "Admin Commission";
      case "super_admin_cut":
        return "Platform Commission";
      case "deposit":
        return "Deposit";
      case "withdrawal":
        return "Withdrawal";
      default:
        return type;
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type.includes("payout") || type.includes("cut") || type === "deposit") {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (isUserLoading || isBalanceLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Account Management</h1>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {balance ? formatCurrency((balance as any).balance) : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Available funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {balance
                ? formatCurrency((balance as any).totalEarnings)
                : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              From contests and commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {balance ? formatCurrency((balance as any).totalSpent) : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Contest entry fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="funds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="funds" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Manage Funds
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transaction History
          </TabsTrigger>
        </TabsList>

        {/* Manage Funds Tab */}
        <TabsContent value="funds" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Funds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-500" />
                  Add Funds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={addFundsForm.handleSubmit(handleAddFunds)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="addAmount">Amount ($)</Label>
                    <Input
                      id="addAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="100.00"
                      {...addFundsForm.register("amount")}
                    />
                    {addFundsForm.formState.errors.amount && (
                      <p className="text-sm text-red-500">
                        {addFundsForm.formState.errors.amount.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addFundsMutation.isPending}
                  >
                    {addFundsMutation.isPending ? "Adding..." : "Add Funds"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Withdraw Funds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="h-5 w-5 text-red-500" />
                  Withdraw Funds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={withdrawFundsForm.handleSubmit(handleWithdrawFunds)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="withdrawAmount">Amount ($)</Label>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="50.00"
                      {...withdrawFundsForm.register("amount")}
                    />
                    {withdrawFundsForm.formState.errors.amount && (
                      <p className="text-sm text-red-500">
                        {withdrawFundsForm.formState.errors.amount.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={withdrawFundsMutation.isPending}
                  >
                    {withdrawFundsMutation.isPending
                      ? "Withdrawing..."
                      : "Withdraw Funds"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(handleUpdateProfile)}
                className="space-y-6"
              >
                {/* Profile Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    {profileForm.watch("profileImageUrl") ? (
                      <img
                        src={profileForm.watch("profileImageUrl")}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <LocalFileUploader
                      accept="image/*"
                      maxSizeMB={5}
                      onUploadComplete={handleAvatarUpload}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Upload a profile picture. Maximum size: 5MB
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...profileForm.register("firstName")}
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-sm text-red-500">
                        {profileForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...profileForm.register("lastName")}
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-sm text-red-500">
                        {profileForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register("email")}
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    updateProfileMutation.isPending ||
                    !profileForm.formState.isDirty
                  }
                >
                  {updateProfileMutation.isPending
                    ? "Updating..."
                    : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {isTransactionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-200 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : (transactions as any[]).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-3">
                  {(transactions as any[]).map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">
                            {formatTransactionType(transaction.type)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(transaction.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            parseFloat(transaction.amount) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {parseFloat(transaction.amount) >= 0 ? "+" : ""}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Balance: {formatCurrency(transaction.balanceAfter)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
