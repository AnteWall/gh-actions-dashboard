import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Legacy functions kept for reference - can be removed
// The main dashboard functions are in queries.ts and workflowRuns.ts

// Example query - demonstrates how to read from the database
export const exampleQuery = query({
  args: {},
  handler: async (ctx) => {
    // Get dashboard statistics
    const repositories = await ctx.db.query('repositories').collect()
    return {
      repositoryCount: repositories.length,
    }
  },
})

// Example mutation - demonstrates how to write to the database
export const exampleMutation = mutation({
  args: {
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    console.log('Example mutation called with:', args.message)
    // This is just a demo - real mutations are in workflowRuns.ts
    return null
  },
})
