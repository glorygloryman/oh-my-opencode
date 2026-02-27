import { existsSync, mkdirSync, statSync, lstatSync, symlinkSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { PluginInput } from "@opencode-ai/plugin"
import { getPlanName } from "../../features/boulder-state"

export interface SyncPlanResult {
  success: boolean
  targetPath?: string
  error?: string
}

export function syncPlanToProjectDocs(ctx: PluginInput, planPath: string): SyncPlanResult {
  try {
    if (!existsSync(planPath)) {
      return { success: false, error: `source plan ${planPath} does not exist` }
    }

    const stat = statSync(planPath)
    const date = new Date(stat.birthtimeMs || stat.mtimeMs)
    const dateStr = date.toISOString().split("T")[0]

    const rawPlanName = getPlanName(planPath)
    const cleanPlanName = rawPlanName.replace(/\.md$/, "")

    const targetDir = join(ctx.directory, "project-docs", "plans")
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    const targetPath = join(targetDir, `${dateStr}-${cleanPlanName}.md`)

    if (existsSync(targetPath)) {
      rmSync(targetPath, { force: true })
    }

    symlinkSync(planPath, targetPath)

    return { success: true, targetPath }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { success: false, error: err }
  }
}
