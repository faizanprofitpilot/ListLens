import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Check if user already exists in users table
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching user:', fetchError)
      return NextResponse.json({ 
        error: 'Database error',
        details: fetchError.message 
      }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User record already exists',
        user: existingUser
      })
    }

    // Create new user record
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        is_pro: false,
        free_edits_used: 0
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json({ 
        error: 'Failed to create user record',
        details: createError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User record created successfully',
      user: newUser
    })

  } catch (error) {
    console.error('Create user record error:', error)
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
