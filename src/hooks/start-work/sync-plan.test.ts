import { expect, test, describe, beforeEach, afterEach, mock, spyOn } from "bun:test"
import { join } from "node:path"
import * as fs from "node:fs"
import { syncPlanToProjectDocs } from "./sync-plan"

describe("syncPlanToProjectDocs", () => {
  let statSyncSpy: ReturnType<typeof spyOn>
  let existsSyncSpy: ReturnType<typeof spyOn>
  let mkdirSyncSpy: ReturnType<typeof spyOn>
  let rmSyncSpy: ReturnType<typeof spyOn>
  let symlinkSyncSpy: ReturnType<typeof spyOn>

  const testDir = "/mock/project"
  const sisyphusPlansDir = join(testDir, ".sisyphus", "plans")
  const targetDir = join(testDir, "project-docs", "plans")

  beforeEach(() => {
    // Return true for the plan existing, false for target directory
    existsSyncSpy = spyOn(fs, "existsSync").mockImplementation((p) => {
      const pathStr = p.toString()
      if (pathStr.includes(".sisyphus")) return true
      if (pathStr.includes("project-docs")) return false
      return false
    })

    statSyncSpy = spyOn(fs, "statSync").mockImplementation(() => {
      return {
        birthtimeMs: new Date("2026-03-01T10:00:00.000Z").getTime(),
        mtimeMs: new Date("2026-03-02T10:00:00.000Z").getTime(),
      } as any
    })

    mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined)
    rmSyncSpy = spyOn(fs, "rmSync").mockImplementation(() => undefined)
    symlinkSyncSpy = spyOn(fs, "symlinkSync").mockImplementation(() => undefined)
  })

  afterEach(() => {
    mock.restore()
  })

  test("should return error when source plan does not exist", () => {
    existsSyncSpy.mockReturnValue(false)
    const ctx = { directory: testDir, client: {} as any }
    const result = syncPlanToProjectDocs(ctx, join(testDir, "nonexistent.md"))
    expect(result.success).toBeFalse()
    expect(result.error).toContain("does not exist")
  })

  test("should create symlink using birthtime date prefix and relative path (Critical Bug Fix)", () => {
    const planPath = join(sisyphusPlansDir, "my-test.md")
    const ctx = { directory: testDir, client: {} as any }
    const result = syncPlanToProjectDocs(ctx, planPath)

    expect(result.success).toBeTrue()
    expect(result.targetPath).toBeDefined()
    expect(result.targetPath!.endsWith("2026-03-01-my-test.md")).toBeTrue()

    // It MUST use the relative linking
    // targetDir is /mock/project/project-docs/plans
    // relative distance back to plan is ../../.sisyphus/plans/my-test.md
    expect(symlinkSyncSpy).toHaveBeenCalledWith(
      "../../.sisyphus/plans/my-test.md",
      result.targetPath
    )
  })

  test("should strip duplicate .md suffix from plan name", () => {
    const planPath = join(sisyphusPlansDir, "test-plan.md")

    const ctx = { directory: testDir, client: {} as any }
    const result = syncPlanToProjectDocs(ctx, planPath)

    expect(result.success).toBeTrue()
    expect(result.targetPath!.endsWith(".md.md")).toBeFalse()
    expect(result.targetPath!.endsWith("test-plan.md")).toBeTrue()
  })

  test("should unconditionally clean up target without using existsSync block to avoid EEXIST on dead links (Important Bug Fix)", () => {
    const planPath = join(sisyphusPlansDir, "resume-test.md")
    const ctx = { directory: testDir, client: {} as any }

    // First run
    syncPlanToProjectDocs(ctx, planPath)

    // Validate we called rmSync blindly before symlinking to prevent dead links
    expect(rmSyncSpy).toHaveBeenCalledWith(expect.any(String), { force: true })
  })
})
