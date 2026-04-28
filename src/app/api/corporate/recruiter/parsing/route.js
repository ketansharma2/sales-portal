    // First get user's own records
    const { data: myData, error: myError } = await supabaseServer
      .from('cv_parsing')
      .select('*')
      .eq('user_id', userId)
      .ilike('sector', 'corporate')
      .order('created_at', { ascending: false })

    // Then get records where other_users contains userId
    const { data: sharedData, error: sharedError } = await supabaseServer
      .from('cv_parsing')
      .select('*')
      .contains('other_users', [userId])
      .ilike('sector', 'corporate')
      .order('created_at', { ascending: false })