/**
 * Folder Audit & Subfolder Quality Analysis Utility.
 * Evaluates code quality, algorithmic complexity, bottleneck risk,
 * and builds directory trees for batch optimization.
 */

import { detectLanguage } from "./languageDetector";

export interface FileQualityReport {
  id: string;
  path: string; // Relative path, e.g. "backend/services/sorter.py"
  name: string; // Basename, e.g. "sorter.py"
  subfolder: string; // Subfolder path, e.g. "backend/services"
  language: string; // e.g. "python", "typescript"
  code: string;
  linesOfCode: number;
  qualityScore: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  complexity: "Low" | "Medium" | "High" | "Critical";
  timeComplexity: string; // e.g. "O(n²)"
  spaceComplexity: string; // e.g. "O(n)"
  detectedBottlenecks: string[];
  optimizationSuggestions: string[];
  estimatedSpeedupPct: number;
  optimizedCode?: string;
  isOptimized?: boolean;
}

export interface FolderQualitySummary {
  path: string; // e.g. "backend/services"
  name: string; // e.g. "services"
  fileCount: number;
  averageScore: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  flaggedFilesCount: number;
  files: FileQualityReport[];
}

export interface FolderTreeNode {
  name: string;
  path: string;
  type: "folder" | "file";
  fileData?: FileQualityReport;
  children?: FolderTreeNode[];
  summary?: {
    averageScore: number;
    grade: "A+" | "A" | "B" | "C" | "D" | "F";
    totalFiles: number;
    flaggedFiles: number;
  };
}

export interface BatchOptimizationProgress {
  totalFiles: number;
  completedFiles: number;
  currentFilePath: string;
  isProcessing: boolean;
  cumulativeTimeSavedMs: number;
  cumulativeRamSavedMb: number;
  logs: string[];
}

/**
 * Heuristically evaluates source code quality and bottlenecks for quick local audit.
 */
export function analyzeFileQuality(code: string, filepath: string): FileQualityReport {
  const name = filepath.split("/").pop() || filepath;
  const parts = filepath.split("/");
  const subfolder = parts.length > 1 ? parts.slice(0, -1).join("/") : "root";
  const language = detectLanguage(code).language;
  const lines = code.split("\n").filter((l) => l.trim().length > 0);
  const linesOfCode = lines.length;

  let penalty = 0;
  const bottlenecks: string[] = [];
  const suggestions: string[] = [];

  // Check for nested loops
  const nestedLoopPattern = /(for|while)[\s\S]*?\{?[\s\S]*?(for|while)/g;
  const tripleLoopPattern = /(for|while)[\s\S]*?(for|while)[\s\S]*?(for|while)/g;
  if (tripleLoopPattern.test(code)) {
    penalty += 35;
    bottlenecks.push("Critical $O(n^3)$ cubic nested loop structure detected");
    suggestions.push("Refactor nested loops using Hash Maps or Divide & Conquer algorithms");
  } else if (nestedLoopPattern.test(code) || /for.*in.*for.*in/g.test(code)) {
    penalty += 22;
    bottlenecks.push("Quadratic $O(n^2)$ nested loop bottleneck");
    suggestions.push("Replace nested iteration with vectorized operations or linear lookup tables");
  }

  // Check for inefficient sorting / search
  if (/bubble_sort|bubblesort|select_sort|insertionsort/i.test(code)) {
    penalty += 25;
    bottlenecks.push("Inefficient $O(n^2)$ sorting implementation");
    suggestions.push("Upgrade to native Timsort or QuickSort $O(n \\log n)$ algorithm");
  }

  // Check for heavy memory allocation / linear search in loop
  if (/append\(.*for|push\(.*for|\.includes\(.*for/g.test(code)) {
    penalty += 15;
    bottlenecks.push("Repeated dynamic array re-allocation in loop body");
    suggestions.push("Pre-allocate buffer array capacity or use Set data structure");
  }

  // Check for deep recursion
  if (/def\s+(\w+)\(.*\):[\s\S]*?\1\(/.test(code) || /function\s+(\w+)\(.*\)\s*\{[\s\S]*?\1\(/.test(code)) {
    if (!/memo|cache|lru_cache/i.test(code)) {
      penalty += 18;
      bottlenecks.push("Un-memoized recursive stack frame overhead");
      suggestions.push("Apply dynamic programming or `@lru_cache` memoization decorator");
    }
  }

  // Check for long file size
  if (linesOfCode > 150) {
    penalty += 10;
    bottlenecks.push("Monolithic function structure (>150 lines)");
    suggestions.push("Decompose module into single-responsibility utility functions");
  }

  if (bottlenecks.length === 0) {
    suggestions.push("Code follows clean functional programming principles");
    suggestions.push("Memory layout is compact with minimal allocation churn");
  }

  const qualityScore = Math.max(25, Math.min(99, 100 - penalty));

  let grade: FileQualityReport["grade"] = "A+";
  if (qualityScore < 50) grade = "F";
  else if (qualityScore < 65) grade = "D";
  else if (qualityScore < 78) grade = "C";
  else if (qualityScore < 88) grade = "B";
  else if (qualityScore < 95) grade = "A";

  let complexity: FileQualityReport["complexity"] = "Low";
  let timeComplexity = "O(n)";
  let spaceComplexity = "O(1)";

  if (penalty >= 35) {
    complexity = "Critical";
    timeComplexity = "O(n³)";
    spaceComplexity = "O(n)";
  } else if (penalty >= 20) {
    complexity = "High";
    timeComplexity = "O(n²)";
    spaceComplexity = "O(n)";
  } else if (penalty >= 10) {
    complexity = "Medium";
    timeComplexity = "O(n log n)";
    spaceComplexity = "O(1)";
  }

  const estimatedSpeedupPct = Math.min(85, Math.max(15, Math.round(penalty * 1.8 + 12)));

  return {
    id: `file_${Math.random().toString(36).substr(2, 9)}`,
    path: filepath,
    name,
    subfolder,
    language,
    code,
    linesOfCode,
    qualityScore,
    grade,
    complexity,
    timeComplexity,
    spaceComplexity,
    detectedBottlenecks: bottlenecks,
    optimizationSuggestions: suggestions,
    estimatedSpeedupPct,
  };
}

/**
 * Builds a hierarchical folder tree from a flat list of FileQualityReports.
 */
export function buildFolderTree(files: FileQualityReport[]): FolderTreeNode[] {
  const rootNodes: Map<string, FolderTreeNode> = new Map();

  const getOrFolderNode = (folderPath: string, parentMap: Map<string, FolderTreeNode>): FolderTreeNode => {
    if (parentMap.has(folderPath)) return parentMap.get(folderPath)!;

    const parts = folderPath.split("/");
    const name = parts[parts.length - 1];
    const folderNode: FolderTreeNode = {
      name,
      path: folderPath,
      type: "folder",
      children: [],
    };
    parentMap.set(folderPath, folderNode);
    return folderNode;
  };

  files.forEach((file) => {
    const parts = file.path.split("/");
    if (parts.length === 1) {
      // Root level file
      rootNodes.set(file.path, {
        name: file.name,
        path: file.path,
        type: "file",
        fileData: file,
      });
    } else {
      // File inside subfolders
      const folderParts = parts.slice(0, -1);
      let currentPath = "";

      let currentParentChildren: FolderTreeNode[] | undefined = undefined;

      for (let i = 0; i < folderParts.length; i++) {
        currentPath = currentPath ? `${currentPath}/${folderParts[i]}` : folderParts[i];
        let folderNode: FolderTreeNode;

        if (i === 0) {
          folderNode = getOrFolderNode(currentPath, rootNodes);
          currentParentChildren = folderNode.children;
        } else {
          let found = currentParentChildren?.find((c) => c.path === currentPath);
          if (!found) {
            found = {
              name: folderParts[i],
              path: currentPath,
              type: "folder",
              children: [],
            };
            currentParentChildren?.push(found);
          }
          currentParentChildren = found.children;
        }
      }

      currentParentChildren?.push({
        name: file.name,
        path: file.path,
        type: "file",
        fileData: file,
      });
    }
  });

  // Calculate folder statistics recursively
  const calculateFolderSummaries = (node: FolderTreeNode): { totalScore: number; count: number; flagged: number } => {
    if (node.type === "file" && node.fileData) {
      return {
        totalScore: node.fileData.qualityScore,
        count: 1,
        flagged: node.fileData.qualityScore < 80 ? 1 : 0,
      };
    }

    let totalScore = 0;
    let count = 0;
    let flagged = 0;

    if (node.children) {
      node.children.forEach((child) => {
        const stats = calculateFolderSummaries(child);
        totalScore += stats.totalScore;
        count += stats.count;
        flagged += stats.flagged;
      });
    }

    const avgScore = count > 0 ? Math.round(totalScore / count) : 100;
    let grade: FileQualityReport["grade"] = "A+";
    if (avgScore < 50) grade = "F";
    else if (avgScore < 65) grade = "D";
    else if (avgScore < 78) grade = "C";
    else if (avgScore < 88) grade = "B";
    else if (avgScore < 95) grade = "A";

    node.summary = {
      averageScore: avgScore,
      grade,
      totalFiles: count,
      flaggedFiles: flagged,
    };

    return { totalScore, count, flagged };
  };

  const result = Array.from(rootNodes.values());
  result.forEach((node) => calculateFolderSummaries(node));
  return result;
}

/**
 * Built-in Preset Repositories for instant demo & testing.
 */
export const SAMPLE_PRESET_FOLDERS: Record<string, { title: string; description: string; files: { path: string; code: string }[] }> = {
  backend: {
    title: "⚡ Backend Architecture Microservice",
    description: "Multi-layered Node/Python backend with database drivers, sorters, and controllers.",
    files: [
      {
        path: "backend/services/sorter.py",
        code: `import random

def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

data = [random.randint(1, 500) for _ in range(800)]
sorted_data = bubble_sort(data)
print("Sorted len:", len(sorted_data))
`,
      },
      {
        path: "backend/controllers/authController.ts",
        code: `export function validateSessionTokens(tokens: string[], activeUsers: string[]) {
  const validSessions: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    for (let j = 0; j < activeUsers.length; j++) {
      if (tokens[i].includes(activeUsers[j])) {
        if (!validSessions.includes(tokens[i])) {
          validSessions.push(tokens[i]);
        }
      }
    }
  }
  return validSessions;
}
`,
      },
      {
        path: "backend/utils/cacheManager.js",
        code: `function findDuplicateKeys(listA, listB) {
  const duplicates = [];
  for (let i = 0; i < listA.length; i++) {
    for (let j = 0; j < listB.length; j++) {
      if (listA[i] === listB[j]) {
        duplicates.push(listA[i]);
      }
    }
  }
  return duplicates;
}

module.exports = { findDuplicateKeys };
`,
      },
      {
        path: "backend/middleware/rateLimiter.go",
        code: `package main

import "fmt"

func ProcessRequests(requests []string) int {
	processed := 0
	for i := 0; i < len(requests); i++ {
		for j := 0; j < len(requests); j++ {
			if i != j && requests[i] == requests[j] {
				processed++
			}
		}
	}
	return processed
}

func main() {
	reqs := []string{"192.168.1.1", "10.0.0.1", "192.168.1.1"}
	fmt.Println("Processed:", ProcessRequests(reqs))
}
`,
      },
    ],
  },
  compiler: {
    title: "⚙️ Compiler & Code Generation Pipeline",
    description: "High-performance AST parsers, C++ memory allocators, and Rust tokenizers.",
    files: [
      {
        path: "compiler/parser/astBuilder.cpp",
        code: `#include <iostream>
#include <vector>

void processASTNodes(std::vector<int> nodes) {
    for (size_t i = 0; i < nodes.size(); i++) {
        for (size_t j = 0; j < nodes.size(); j++) {
            if (nodes[i] == nodes[j]) {
                std::cout << "Node match: " << nodes[i] << std::endl;
            }
        }
    }
}

int main() {
    std::vector<int> tree = {10, 20, 30, 10, 50};
    processASTNodes(tree);
    return 0;
}
`,
      },
      {
        path: "compiler/lexer/tokenizer.rs",
        code: `pub fn tokenize_stream(source: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let words: Vec<&str> = source.split_whitespace().collect();
    for i in 0..words.len() {
        for j in 0..words.len() {
            if words[i] == words[j] && i != j {
                tokens.push(words[i].to_string());
            }
        }
    }
    tokens
}

fn main() {
    let code = "fn main() { let x = 10; }";
    let res = tokenize_stream(code);
    println!("Tokens count: {}", res.len());
}
`,
      },
    ],
  },
};
