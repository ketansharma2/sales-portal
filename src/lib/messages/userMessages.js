export const actions = {
  "common": {
    "missingFields": "Missing required fields: name, email, password, roles",
    "userNotFound": "User profile not found",
    "unauthorized": "Unauthorized",
    "invalidToken": "Invalid token",
    "internalError": "Internal server error"
  },
  
    "admin": {
      "userCreated": "User created successfully",
      "userUpdated": "User updated successfully",
      "userDeleted": "User deleted successfully",
      "userProfileUpdated": "Admin profile updated",
      "fetchUsersError": "Failed to fetch users",
      "createUserError": "Failed to create user account",
      "profileCreateError": "User account created but profile creation failed",
      "updateUserError": "Failed to update user"
    },
     "crm": {
      "userCreated": {"title": "User Created", "message": "New team member added"},
      "userUpdated": {"title": "User Updated", "message": "Team member details updated"},
      "workbenchUpdated": {"title": "Workbench Updated", "message": "Workbench updated successfully"},
      "workbenchCreated": {"title": "Workbench Created", "message": "Workbench created successfully"},
      "workbenchDeleted": {"title": "Workbench Deleted", "message": "Workbench deleted successfully"},
      "targetUpdated": {"title": "Target Updated", "message": "Target updated successfully"},
      "targetCreated": {"title": "Target Created", "message": "Target created successfully"},
      "createdNewdomesticJobpost": {"title": "New Job Post Required", "message": "New job post required for the domestic team"},
      "createdNewcorporateJobpost": {"title": "New Job Post Required", "message": "New job post required for the corporate team"}
    },
    "manager": {
      "userCreated": {"title": "User Created", "message": "New team member added"},
      "userUpdated": {"title": "User Updated", "message": "Team member details updated"}
    },
    "recruiter": {
      "userCreated": {"title": "User Created", "message": "Recruiter account created"},
      "userUpdated": {"title": "User Updated", "message": "Recruiter profile updated"},
      "trackerSentbyRC": {"title": "Tracker Sent By Recruiter", "message": "Tracker sent by Recruiter to Team Lead"}
    },
    "tl": {
      "userCreated": {"title": "User Created", "message": "Team lead account created"},
      "userUpdated": {"title": "User Updated", "message": "Team lead profile updated"},
      "tlAssignedWorkbench": {"title": "Workbench Assigned", "message": "Team lead assigned to workbench"},
      "targetUpdated": {"title": "Target Updated", "message": "Target updated by Team Lead successfully"},
      "targetCreated": {"title": "Target Created", "message": "Target created by Team Lead successfully"},
      "tlsendBulkTracker": {"title": "Bulk Tracker Sent By Team Lead", "message": "Bulk tracker sent by Team Lead"},
      "tlsendTracker": {"title": "Tracker Sent By Team Lead", "message": "Tracker sent by Team Lead"}

    },
    "fse": {
      "userCreated": {"title": "User Created", "message": "Field sales executive added"},
      "userUpdated": {"title": "User Updated", "message": "FSE profile updated"}
    }
  ,
  "validation": {
    "userIdRequired": "user_id is required",
    "invalidEmail": "Please provide a valid email address",
    "weakPassword": "Password must be at least 6 characters"
  }
}
