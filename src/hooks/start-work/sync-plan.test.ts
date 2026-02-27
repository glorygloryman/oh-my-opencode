import { expect, test, describe, beforeEach, afterEach } from "bun:test"
import { join } from "node:path"
import { existsSync, mkdirSync, rmSync, writeFileSync, lstatSync, readlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import { syncPlanToProjectDocs } from "./sync-plan"

describe("syncPlanToProjectDocs", () => {
  let testDir: string
  let plansDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `sync-plan-test-${randomUUID()}`)
    plansDir = join(testDir, "project-docs", "plans")
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("should return error when source plan does not exist", () => {
    const ctx = { directory: testDir, client: {} as any }
    const result = syncPlanToProjectDocs(ctx, join(testDir, "nonexistent.md"))
    expect(result.success).toBeFalse()
    expect(result.error).toContain("does not exist")
  })

  test("should create symlink to real file with birthtime date prefix", () => {
    const sisyphusPlansDir = join(testDir, ".sisyphus", "plans")
    mkdirSync(sisyphusPlansDir, { recursive: true })
    const planPath = join(sisyphusPlansDir, "my-test.md")
    writeFileSync(planPath, "# Test Plan")

    const ctx = { directory: testDir, client: {} as any }
    const result = syncPlanToProjectDocs(ctx, planPath)

    expect(result.success).toBeTrue()
    expect(result.targetPath).toBeDefined()
    expect(result.targetPath!.endsWith("my-test.md")).toBeTrue()
    expect(result.targetPath!.endsWith(".md.md")).toBeFalse()

    const stat = lstatSync(result.targetPath!)
    expect(stat.isSymbolicLink()).toBeTrue()

    const target = readlinkSync(result.targetPath!)
    expect(target).toBe(planPath)
  })

  test("should safely overwrite existing symlink if it exists", () => {
    const sisyphusPlansDir = join(testDir, ".sisyphus", "plans")
    mkdirSync(sisyphusPlansDir, { recursive: true })
    const planPath = join(sisyphusPlansDir, "resume-test.md")
    writeFileSync(planPath, "# Original")

    const ctx = { directory: testDir, client: {} as any }

    syncPlanToProjectDocs(ctx, planPath)
    const result2 = syncPlanToProjectDocs(ctx, planPath)

    expect(result2.success).toBeTrue()
    const stat = lstatSync(result2.targetPath!)
    expect(stat.isSymbolicLink()).toBeTrue()
  })

  test("should strip duplicate .md suffix from plan name", () => {
    const sisyphusPlansDir = join(testDir, ".sisyphus", "plans")
    mkdirSync(sisyphusPlansDir, { recursive: true })
    const planPath = join(sisyphusPlansDir, "test-plan.md")
    writeFileSync(planPath, "# Test Plan")

    const ctx = { directory: testDir, client: {} as any }
    const result = syncPlanToProjectDocs(ctx, planPath)

    expect(result.success).toBeTrue()
    expect(result.targetPath).toBeDefined()
    expect(result.targetPath!.endsWith(".md.md")).toBeFalse()
  })

  test("should create target directory if it does not exist", () => {
    const sisyphusPlansDir = join(testDir, ".sisyphus", "plans")
    mkdirSync(sisyphusPlansDir, { recursive: true })
    const planPath = join(sisyphusPlansDir, "new-plan.md")
    writeFileSync(planPath, "# New Plan")

    expect(existsSync(plansDir)).toBeFalse()

    const ctx = { directory: testDir, client: {} as any }
    const result = syncPlanToProjectDocs(ctx, planPath)

    expect(result.success).toBeTrue()
    expect(existsSync(plansDir)).toBeTrue()
    expect(existsSync(result.targetPath!)).toBeTrue()
  })
})
