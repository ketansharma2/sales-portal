// import { supabaseServer } from "@/lib/supabase-server";
// import { NextResponse } from "next/server";
// import { getUser } from "@/lib/auth-helper";

// export async function GET(request) {
//   try {
//     // 1. Authentication
//     const { user, error: authError } = getUser(request);

//     if (authError || !user) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     // 2. Check Manager role
//     const { data: userProfile, error: profileError } =
//       await supabaseServer
//         .from("users")
//         .select("user_id, role")
//         .eq("user_id", user.id)
//         .single();

//     if (profileError || !userProfile) {
//       return NextResponse.json(
//         { error: "User profile not found" },
//         { status: 404 }
//       );
//     }

//     if (
//       !userProfile.role ||
//       !userProfile.role.includes("MANAGER")
//     ) {
//       return NextResponse.json(
//         {
//           error: "Access denied. Manager role required.",
//         },
//         { status: 403 }
//       );
//     }

//     // 3. Get Manager's LeadGen team
//     const { data: leadgenTeam, error: leadgenTeamError } =
//       await supabaseServer
//         .from("users")
//         .select("user_id, name")
//         .eq("manager_id", user.id)
//         .contains("role", ["LEADGEN"]);

//     if (leadgenTeamError) {
//       console.error(
//         "LeadGen team fetch error:",
//         leadgenTeamError
//       );

//       return NextResponse.json(
//         {
//           error: "Failed to fetch LeadGen team",
//           details: leadgenTeamError.message,
//         },
//         { status: 500 }
//       );
//     }

//     const leadgenIds =
//       leadgenTeam?.map((member) => member.user_id) || [];

//     // 4. Get LeadGen leads
//     let leadgenLeads = [];

//     if (leadgenIds.length > 0) {
//       const { data, error } = await supabaseServer
//         .from("corporate_leadgen_leads")
//         .select("client_id, leadgen_id")
//         .in("leadgen_id", leadgenIds);

//       if (error) {
//         console.error(
//           "LeadGen leads fetch error:",
//           error
//         );

//         return NextResponse.json(
//           {
//             error: "Failed to fetch LeadGen leads",
//             details: error.message,
//           },
//           { status: 500 }
//         );
//       }

//       leadgenLeads = data || [];
//     }

//     // 5. Onboard Team
//     const onboardTeam = leadgenLeads.length;

//     const leadgenClientIds = new Set(
//       leadgenLeads.map((lead) => lead.client_id)
//     );

//     // 6. Get Manager leads
//     const { data: managerLeads, error: managerLeadsError } =
//       await supabaseServer
//         .from("corporate_manager_leads")
//         .select(`
//           client_id,
//           user_id,
//           sourcing_date,
//           sent_to_crm
//         `)
//         .eq("user_id", user.id);

//     if (managerLeadsError) {
//       console.error(
//         "Manager leads fetch error:",
//         managerLeadsError
//       );

//       return NextResponse.json(
//         {
//           error: "Failed to fetch Manager leads",
//           details: managerLeadsError.message,
//         },
//         { status: 500 }
//       );
//     }

//     const managerLeadRows = managerLeads || [];

//     // 7. Manager Dependent
//     const managerCalls = managerLeadRows.length;

//     const managerClientIds = new Set(
//       managerLeadRows.map((lead) => lead.client_id)
//     );

//     // 8. Send to CRM
//     const sendToCRM = managerLeadRows.filter((lead) => {
//       const value = String(lead.sent_to_crm || "")
//         .trim()
//         .toLowerCase();

//       return (
//         value === "true" ||
//         value === "yes" ||
//         value === "1" ||
//         value === "sent"
//       );
//     }).length;

//     // 9. Get Manager interactions
//     let managerInteractions = [];

//     if (managerClientIds.size > 0) {
//       const { data, error } = await supabaseServer
//         .from("corporate_manager_interaction")
//         .select(`
//           id,
//           client_id,
//           user_id,
//           date,
//           status,
//           sub_status,
//           created_at
//         `)
//         .in(
//           "client_id",
//           Array.from(managerClientIds)
//         )
//         .order("created_at", {
//           ascending: false,
//         });

//       if (error) {
//         console.error(
//           "Manager interaction fetch error:",
//           error
//         );

//         return NextResponse.json(
//           {
//             error: "Failed to fetch Manager interactions",
//             details: error.message,
//           },
//           { status: 500 }
//         );
//       }

//       managerInteractions = data || [];
//     }

//     // 10. Unique interacted clients
//     const interactedClientIds = new Set(
//       managerInteractions
//         .map((interaction) => interaction.client_id)
//         .filter((clientId) =>
//           managerClientIds.has(clientId)
//         )
//     );

//     const interacted = interactedClientIds.size;

//     // 11. Pending
//     let pending = 0;

//     for (const clientId of managerClientIds) {
//       if (!interactedClientIds.has(clientId)) {
//         pending++;
//       }
//     }

//     // 12. Latest interaction per client
//     const latestInteractionByClient = new Map();

//     for (const interaction of managerInteractions) {
//       const clientId = interaction.client_id;

//       if (!managerClientIds.has(clientId)) {
//         continue;
//       }

//       if (!latestInteractionByClient.has(clientId)) {
//         latestInteractionByClient.set(
//           clientId,
//           interaction
//         );
//       }
//     }

//     // 13. Normalize status
//     const normalize = (value) =>
//       String(value || "")
//         .trim()
//         .toLowerCase()
//         .replace(/[_-]+/g, " ")
//         .replace(/\s+/g, " ");

//     // 14. Interaction status KPIs
//     let interested = 0;
//     let notInterested = 0;
//     let notPicked = 0;
//     let callBack = 0;

   

//     // 15. LeadGen interactions
//     let leadgenInteractions = [];
//     if (leadgenClientIds.size > 0) {
//       const { data, error } = await supabaseServer
//   .from("corporate_leads_interaction")
//   .select("*")




//       if (error) {
//         console.error(
//           "LeadGen interaction fetch error:",
//           error
//         );

//         return NextResponse.json(
//           {
//             error: "Failed to fetch LeadGen interactions",
//             details: error.message,
//           },
//           { status: 500 }
//         );
//       }

//       leadgenInteractions = data || [];
//     }

//     // 16. Actual Onboard
//     const onboardClientIds = new Set();

//     for (const interactionRow of leadgenInteractions) {
//       const status = normalize(interactionRow.status);
//       const subStatus = normalize(
//         interactionRow.sub_status
//       );

//       if (
//         status === "onboard" 
//       ) {
//         onboardClientIds.add(
//           interactionRow.client_id
//         );
//       }
//     }


//      for (const latest of leadgenInteractions) {
//       const status = normalize(latest.status);
//       const subStatus = normalize(latest.sub_status);

//       const currentStatus = status || subStatus;

//       if (currentStatus === "interested") {
//         interested++;
//       } else if (currentStatus === "not interested") {
//         notInterested++;
//       } else if (
//         currentStatus === "not picked" ||
//         currentStatus === "not picked call"
//       ) {
//         notPicked++;
//       } else if (
//         currentStatus === "call back" ||
//         currentStatus === "callback"
//       ) {
//         callBack++;
//       }
//     }

   

// for (const interactionRow of leadgenInteractions) {
//   const status = normalize(interactionRow.status);
 
  
//   if (
//     status === "onboard" 
//   ) {
//     console.log("LeadGen Interaction Row:", interactionRow);
//   console.log("Normalized Status:", status);
//     onboardClientIds.add(interactionRow.client_id);
//   }
// }



//     const onboard = onboardClientIds.size;

//     // 17. Final response
//     return NextResponse.json({
//       success: true,

//       managerId: user.id,

//       team: {
//         leadgenCount: leadgenIds.length,
//         leadgenIds,
//       },

//       managerKpis: {
//         // Team Flow Tree
//         onboardTeam,
//         sendToCRM,
//         managerCalls: managerCalls,
//         dpm: pending,
//         interested: interacted,

//         // Interaction Status
//         interaction: interested,
//         notInterested,
//         notPicked,
//         callBack,

//         // Actual Onboard
//         onboard,

//         // Current frontend compatibility
//         abandoned: onboard,
//       },

//       summary: {
//         totalLeadgenLeads: onboardTeam,
//         totalManagerLeads: managerCalls,
//         totalInteracted: interacted,
//         totalPending: pending,
//         totalOnboard: onboard,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Manager KPI API error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         error: "Internal server error",
//         details: error?.message || "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }


import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-helper";

export async function GET(request) {
  try {
    // =====================================================
    // 1. Authentication
    // =====================================================

    const { user, error: authError } = getUser(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // =====================================================
    // 2. Date Filter
    // =====================================================

    const { searchParams } = new URL(request.url);

    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    console.log("====================================");
    console.log("MANAGER KPI");
    console.log("Manager:", user.id);
    console.log("From Date:", fromDate);
    console.log("To Date:", toDate);
    console.log("====================================");

    // =====================================================
    // 3. Check Manager Role
    // =====================================================

    const {
      data: userProfile,
      error: profileError,
    } = await supabaseServer
      .from("users")
      .select("user_id, role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        {
          error: "User profile not found",
          details: profileError?.message,
        },
        { status: 404 }
      );
    }

    if (
      !userProfile.role ||
      !userProfile.role.includes("MANAGER")
    ) {
      return NextResponse.json(
        {
          error:
            "Access denied. Manager role required.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // 4. Get Manager's LeadGen Team
    // =====================================================

    const {
      data: leadgenTeam,
      error: leadgenTeamError,
    } = await supabaseServer
      .from("users")
      .select("user_id, name")
      .eq("manager_id", user.id)
      .contains("role", ["LEADGEN"]);

    if (leadgenTeamError) {
      console.error(
        "LeadGen team fetch error:",
        leadgenTeamError
      );

      return NextResponse.json(
        {
          error: "Failed to fetch LeadGen team",
          details: leadgenTeamError.message,
        },
        { status: 500 }
      );
    }

    const leadgenIds =
      leadgenTeam?.map(
        (member) => member.user_id
      ) || [];

    // =====================================================
    // 5. Get LeadGen Leads
    // =====================================================

    let leadgenLeads = [];

    if (leadgenIds.length > 0) {
      let leadgenQuery = supabaseServer
        .from("corporate_leadgen_leads")
        .select(`
          client_id,
          leadgen_id,
          sourcing_date
        `)
        .in("leadgen_id", leadgenIds);

      // Apply date filter only when dates are provided
      if (fromDate && toDate) {
        leadgenQuery = leadgenQuery
          .gte("sourcing_date", fromDate)
          .lte("sourcing_date", toDate);
      }

      const {
        data,
        error,
      } = await leadgenQuery;

      if (error) {
        console.error(
          "LeadGen leads fetch error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Failed to fetch LeadGen leads",
            details: error.message,
            code: error.code || null,
            hint: error.hint || null,
          },
          { status: 500 }
        );
      }

      leadgenLeads = data || [];
    }

    // =====================================================
    // 6. Onboard Team
    // =====================================================

    const onboardTeam =
      leadgenLeads.length;

    const leadgenClientIds = new Set(
      leadgenLeads
        .map(
          (lead) => lead.client_id
        )
        .filter(Boolean)
    );

    // =====================================================
    // 7. Get Manager Leads
    // =====================================================

    let managerQuery = supabaseServer
      .from("corporate_manager_leads")
      .select(`
        client_id,
        user_id,
        sourcing_date,
        sent_to_crm
      `)
      .eq("user_id", user.id);

    // Apply date filter
    if (fromDate && toDate) {
      managerQuery = managerQuery
        .gte("sourcing_date", fromDate)
        .lte("sourcing_date", toDate);
    }

    const {
      data: managerLeads,
      error: managerLeadsError,
    } = await managerQuery;

    if (managerLeadsError) {
      console.error(
        "Manager leads fetch error:",
        managerLeadsError
      );

      return NextResponse.json(
        {
          error:
            "Failed to fetch Manager leads",
          details:
            managerLeadsError.message,
          code:
            managerLeadsError.code || null,
          hint:
            managerLeadsError.hint || null,
        },
        { status: 500 }
      );
    }

    const managerLeadRows =
      managerLeads || [];

    // =====================================================
    // 8. Manager Calls
    // =====================================================

    const managerCalls =
      managerLeadRows.length;

    const managerClientIds =
      new Set(
        managerLeadRows
          .map(
            (lead) => lead.client_id
          )
          .filter(Boolean)
      );

    // =====================================================
    // 9. Send To CRM
    // =====================================================

    const sendToCRM =
      managerLeadRows.filter(
        (lead) => {
          const value = String(
            lead.sent_to_crm || ""
          )
            .trim()
            .toLowerCase();

          return (
            value === "true" ||
            value === "yes" ||
            value === "1" ||
            value === "sent"
          );
        }
      ).length;

    // =====================================================
    // 10. Manager Interactions
    // =====================================================

    let managerInteractions = [];

    if (managerClientIds.size > 0) {
      let managerInteractionQuery =
        supabaseServer
          .from(
            "corporate_manager_interaction"
          )
          .select(`
            id,
            client_id,
            user_id,
            date,
            status,
            sub_status,
            created_at
          `)
          .in(
            "client_id",
            Array.from(
              managerClientIds
            )
          );

      // Apply date filter
      if (fromDate && toDate) {
        managerInteractionQuery =
          managerInteractionQuery
            .gte("date", fromDate)
            .lte("date", toDate);
      }

      const {
        data,
        error,
      } = await managerInteractionQuery
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Manager interaction fetch error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Failed to fetch Manager interactions",
            details: error.message,
            code:
              error.code || null,
            hint:
              error.hint || null,
          },
          { status: 500 }
        );
      }

      managerInteractions =
        data || [];
    }

    // =====================================================
    // 11. Unique Interacted Clients
    // =====================================================

    const interactedClientIds =
      new Set(
        managerInteractions
          .map(
            (interaction) =>
              interaction.client_id
          )
          .filter((clientId) =>
            managerClientIds.has(
              clientId
            )
          )
      );

    const interacted =
      interactedClientIds.size;

    // =====================================================
    // 12. Pending
    // =====================================================

    let pending = 0;

    for (
      const clientId of managerClientIds
    ) {
      if (
        !interactedClientIds.has(
          clientId
        )
      ) {
        pending++;
      }
    }

    // =====================================================
    // 13. Latest Manager Interaction
    // =====================================================

    const latestInteractionByClient =
      new Map();

    for (
      const interaction of
      managerInteractions
    ) {
      const clientId =
        interaction.client_id;

      if (
        !managerClientIds.has(
          clientId
        )
      ) {
        continue;
      }

      if (
        !latestInteractionByClient.has(
          clientId
        )
      ) {
        latestInteractionByClient.set(
          clientId,
          interaction
        );
      }
    }

    // =====================================================
    // 14. Normalize Status
    // =====================================================

    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

    // =====================================================
    // 15. Interaction Status KPIs
    // =====================================================

    let interested = 0;
    let notInterested = 0;
    let notPicked = 0;
    let callBack = 0;

    // =====================================================
    // 16. LeadGen Interactions
    // =====================================================

    let leadgenInteractions = [];

    if (leadgenIds.length > 0) {
      let leadgenInteractionQuery =
        supabaseServer
          .from(
            "corporate_leads_interaction"
          )
          .select(`
            id,
            client_id,
            leadgen_id,
            date,
            status,
            sub_status,
            created_at
          `)
          .in(
            "leadgen_id",
            leadgenIds
          );

      // Apply date filter
      if (fromDate && toDate) {
        leadgenInteractionQuery =
          leadgenInteractionQuery
            .gte("date", fromDate)
            .lte("date", toDate);
      }

      const {
        data,
        error,
      } = await leadgenInteractionQuery
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "LeadGen interaction fetch error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Failed to fetch LeadGen interactions",
            details:
              error.message,
            code:
              error.code || null,
            hint:
              error.hint || null,
            supabaseDetails:
              error.details || null,
          },
          { status: 500 }
        );
      }

      leadgenInteractions =
        data || [];
    }

    // =====================================================
    // 17. Actual Onboard
    // =====================================================

    const onboardClientIds =
      new Set();

    for (
      const interactionRow of
      leadgenInteractions
    ) {
      const status =
        normalize(
          interactionRow.status
        );

      if (
        status === "onboard"
      ) {
        onboardClientIds.add(
          interactionRow.client_id
        );
      }
    }

    // =====================================================
    // 18. Latest LeadGen Interaction Per Client
    // =====================================================

    const latestLeadgenByClient =
      new Map();

    for (
      const interaction of
      leadgenInteractions
    ) {
      const clientId =
        interaction.client_id;

      if (
        !latestLeadgenByClient.has(
          clientId
        )
      ) {
        latestLeadgenByClient.set(
          clientId,
          interaction
        );
      }
    }

    // =====================================================
    // 19. Status Counts
    // =====================================================

    for (
      const latest of
      latestLeadgenByClient.values()
    ) {
      const status =
        normalize(
          latest.status
        );

      const subStatus =
        normalize(
          latest.sub_status
        );

      const currentStatus =
        status || subStatus;

      if (
        currentStatus ===
        "interested"
      ) {
        interested++;
      } else if (
        currentStatus ===
        "not interested"
      ) {
        notInterested++;
      } else if (
        currentStatus ===
          "not picked" ||
        currentStatus ===
          "not picked call"
      ) {
        notPicked++;
      } else if (
        currentStatus ===
          "call back" ||
        currentStatus ===
          "callback"
      ) {
        callBack++;
      }
    }

    // =====================================================
    // 20. Actual Onboard Count
    // =====================================================

    const onboard =
      onboardClientIds.size;

    // =====================================================
    // 21. Final Response
    // =====================================================

    return NextResponse.json({
      success: true,

      managerId: user.id,

      filter: {
        fromDate:
          fromDate || null,
        toDate:
          toDate || null,
      },

      team: {
        leadgenCount:
          leadgenIds.length,
        leadgenIds,
      },

      managerKpis: {
        // Team Flow Tree
        onboardTeam,
        sendToCRM,
        managerCalls,

        // Pending
        dpm: pending,

        // Existing frontend compatibility
        interested: interacted,

        // Interaction Status
        interaction: interested,
        notInterested,
        notPicked,
        callBack,

        // Actual Onboard
        onboard,

        // Frontend compatibility
        abandoned: onboard,
      },

      summary: {
        totalLeadgenLeads:
          onboardTeam,

        totalManagerLeads:
          managerCalls,

        totalInteracted:
          interacted,

        totalPending:
          pending,

        totalOnboard:
          onboard,
      },
    });
  } catch (error) {
    console.error(
      "===================================="
    );

    console.error(
      "MANAGER KPI API ERROR"
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Full Error:",
      error
    );

    console.error(
      "===================================="
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Internal server error",
        details:
          error?.message ||
          "Unknown error",
      },
      { status: 500 }
    );
  }
}