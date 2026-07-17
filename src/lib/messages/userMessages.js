export const actions = {
  "common": {
    "missingFields": "Missing required fields: name, email, password, roles",
    "userNotFound": "User profile not found",
    "unauthorized": "Unauthorized",
    "invalidToken": "Invalid token",
    "internalError": "Internal server error"
  },
  
    "admin": {
       "userCreated": "{actorName} created a new user account successfully",
    "userUpdated": "{actorName} updated a user profile successfully",
    "userDeleted": "{actorName} deleted a user account successfully",
    "userProfileUpdated": {"title": "User Profile Updated", "message": "{actorName} updated user profile details"},
    "fetchUsersError": "Failed to fetch users",
    "createUserError": "Failed to create user account",
    "profileCreateError": "User account created but profile creation failed",
    "updateUserError": "Failed to update user profile"
    },
     "crm": {
        "userCreated": {"title": "User Created", "message": "{actorName} added a new team member"},
    "userUpdated": {"title": "User Updated", "message": "{actorName} updated user details"},
    "workbenchUpdated": {"title": "Workbench Updated", "message": "{actorName} updated the workbench successfully"},
    "workbenchCreated": {"title": "Workbench Created", "message": "{actorName} created a new workbench successfully"},
    "workbenchDeleted": {"title": "Workbench Deleted", "message": "{actorName} deleted the workbench successfully"},
    "targetUpdated": {"title": "Target Updated", "message": "{actorName} updated the target successfully"},
    "targetCreated": {"title": "Target Created", "message": "{actorName} created a new target successfully"},
    "createdNewdomesticJobpost": {"title": "New Job Post Required", "message": "{actorName} requested a new domestic job post"},
    "createdNewcorporateJobpost": {"title": "New Job Post Required", "message": "{actorName} requested a new corporate job post"},
    "sentRevenue": {"title": "Revenue Sent", "message": "{actorName} sent revenue details to Revenue By CRM"}
    },
    "manager": {
      "userCreated": {"title": "User Created", "message": "{actorName} added a new team member"},
    "userUpdated": {"title": "User Updated", "message": "{actorName} updated user details"},
    "targetUpdated": {"title": "Target Updated", "message": "{actorName} updated the target successfully"},
    "targetCreated": {"title": "Target Created", "message": "{actorName} created a new target successfully"},
    "expenseApproved": {"title": "Expense Approved", "message": "{actorName} approved the expense"},
    "expenseRejected": {"title": "Expense Rejected", "message": "{actorName} rejected the expense"}
    },
    "recruiter": {
       "userCreated": {"title": "User Created", "message": "{actorName} created a recruiter account"},
    "userUpdated": {"title": "User Updated", "message": "{actorName} updated the recruiter profile"},
    "trackerSentbyRC": {"title": "Tracker Sent By Recruiter", "message": "{actorName} sent a tracker to Team Lead"}
    },
    "tl": {
    "userCreated": {"title": "User Created", "message": "{actorName} created a team lead account"},
    "userUpdated": {"title": "User Updated", "message": "{actorName} updated the team lead profile"},
    "tlAssignedWorkbench": {"title": "Workbench Assigned", "message": "{actorName} assigned a team member to workbench"},
    "targetUpdated": {"title": "Target Updated", "message": "{actorName} updated the target successfully"},
    "targetCreated": {"title": "Target Created", "message": "{actorName} created a new target successfully"},
    "tlsendBulkTracker": {"title": "Bulk Tracker Sent By Team Lead", "message": "{actorName} sent a bulk tracker"},
    "tlsendTracker": {"title": "Tracker Sent By Team Lead", "message": "{actorName} sent a tracker"}
    },
    "fse": {
        "userCreated": {"title": "User Created", "message": "{actorName} added a new Field Sales Executive"},
    "userUpdated": {"title": "User Updated", "message": "{actorName} updated the FSE profile"}
    },
    "hod": {
       "userCreated": {"title": "User Created", "message": "{actorName} created an HOD account"},
    "userUpdated": {"title": "User Updated", "message": "{actorName} updated the HOD profile"},
    "targetUpdated": {"title": "Target Updated", "message": "{actorName} updated the target successfully"},
    "targetCreated": {"title": "Target Created", "message": "{actorName} created a new target successfully"},
    "approveExpense": {"title": "Expense Approved", "message": "{actorName} approved the expense successfully"},
    "rejectExpense": {"title": "Expense Rejected", "message": "{actorName} rejected the expense"}
    }
  ,
  "validation": {
    "userIdRequired": "user_id is required",
    "invalidEmail": "Please provide a valid email address",
    "weakPassword": "Password must be at least 6 characters"
  }
}
