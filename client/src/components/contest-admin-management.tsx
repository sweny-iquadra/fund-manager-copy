import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserPlus, Crown, Shield, Trash2, ArrowRightLeft, Users } from "lucide-react";

interface ContestAdminManagementProps {
  contestId: string;
  contestName: string;
  isOwner: boolean;
  currentUserId: string;
}

interface ContestAdmin {
  id: number;
  contestId: number;
  userId: string;
  role: "owner" | "admin";
  grantedBy: string;
  grantedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
}

export default function ContestAdminManagement({ 
  contestId, 
  contestName, 
  isOwner, 
  currentUserId 
}: ContestAdminManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("admin");
  const [selectedNewOwner, setSelectedNewOwner] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contest admins
  const { data: admins = [], isLoading } = useQuery({
    queryKey: [`/api/contests/${contestId}/admins`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/contests/${contestId}/admins`);
      if (!response.ok) {
        throw new Error("Failed to fetch contest admins");
      }
      return response.json() as Promise<ContestAdmin[]>;
    },
    enabled: !!contestId,
  });

  // Add admin mutation
  const addAdminMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      const response = await apiRequest("POST", `/api/contests/${contestId}/admins`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add admin");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contests/${contestId}/admins`] });
      toast({
        title: "Success",
        description: "Admin added successfully!",
      });
      setIsAddDialogOpen(false);
      setNewAdminEmail("");
      setNewAdminRole("admin");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add admin",
        variant: "destructive",
      });
    },
  });

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/contests/${contestId}/admins/${userId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove admin");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contests/${contestId}/admins`] });
      toast({
        title: "Success",
        description: "Admin removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove admin",
        variant: "destructive",
      });
    },
  });

  // Transfer ownership mutation
  const transferOwnershipMutation = useMutation({
    mutationFn: async (newOwnerId: string) => {
      const response = await apiRequest("POST", `/api/contests/${contestId}/transfer-ownership`, {
        newOwnerId,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to transfer ownership");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contests/${contestId}/admins`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contests/${contestId}`] });
      toast({
        title: "Success",
        description: "Ownership transferred successfully!",
      });
      setIsTransferDialogOpen(false);
      setSelectedNewOwner("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to transfer ownership",
        variant: "destructive",
      });
    },
  });

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // For now, we'll use email as userId. In a real implementation, you'd want to 
    // search for users by email first to get their ID
    addAdminMutation.mutate({
      userId: newAdminEmail.trim(),
      role: newAdminRole,
    });
  };

  const handleRemoveAdmin = (userId: string) => {
    removeAdminMutation.mutate(userId);
  };

  const handleTransferOwnership = () => {
    if (!selectedNewOwner) {
      toast({
        title: "Error",
        description: "Please select a new owner",
        variant: "destructive",
      });
      return;
    }
    transferOwnershipMutation.mutate(selectedNewOwner);
  };

  const currentUserIsOwner = admins.some(admin => 
    admin.userId === currentUserId && admin.role === "owner"
  );

  const availableAdminsForOwnership = admins.filter(admin => 
    admin.role === "admin" && admin.userId !== currentUserId
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contest Administrators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Loading admins...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Contest Administrators
        </CardTitle>
        <div className="flex gap-2">
          {(isOwner || currentUserIsOwner) && (
            <>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Contest Administrator</DialogTitle>
                    <DialogDescription>
                      Add a new administrator to help manage this contest.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">User Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddAdmin}
                        disabled={addAdminMutation.isPending}
                      >
                        {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {availableAdminsForOwnership.length > 0 && (
                <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Transfer Ownership
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Transfer Contest Ownership</DialogTitle>
                      <DialogDescription>
                        Transfer ownership of "{contestName}" to another admin. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="newOwner">Select New Owner</Label>
                        <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select admin to promote" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAdminsForOwnership.map((admin) => (
                              <SelectItem key={admin.userId} value={admin.userId}>
                                {admin.user.firstName} {admin.user.lastName} ({admin.user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsTransferDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleTransferOwnership}
                          disabled={transferOwnershipMutation.isPending}
                          variant="destructive"
                        >
                          {transferOwnershipMutation.isPending ? "Transferring..." : "Transfer Ownership"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {admins.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No admins found for this contest.
            </div>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    {admin.user.profileImageUrl ? (
                      <img 
                        src={admin.user.profileImageUrl} 
                        alt={`${admin.user.firstName} ${admin.user.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {admin.user.firstName.charAt(0)}
                        {admin.user.lastName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {admin.user.firstName} {admin.user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {admin.user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={admin.role === "owner" ? "default" : "secondary"}>
                    {admin.role === "owner" && <Crown className="w-3 h-3 mr-1" />}
                    {admin.role === "admin" && <Shield className="w-3 h-3 mr-1" />}
                    {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                  </Badge>
                  {(isOwner || currentUserIsOwner) && admin.userId !== currentUserId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Administrator</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {admin.user.firstName} {admin.user.lastName} as an administrator of this contest?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleRemoveAdmin(admin.userId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}