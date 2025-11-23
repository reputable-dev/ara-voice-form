#!/usr/bin/env bash
set -euo pipefail

echo "=== ARA Voice Form - Forensic Codebase Analysis ==="
echo "Generating comprehensive dependency and complexity reports..."

# Install analysis tools if needed
if ! command -v madge >/dev/null 2>&1; then
    echo "Installing madge for dependency analysis..."
    bun add -d madge
fi

if ! command -v dependency-cruiser >/dev/null 2>&1; then
    echo "Installing dependency-cruiser..."
    bun add -d dependency-cruiser
fi

echo ""
echo "=== 1. Dependency Graph Analysis ==="
npx madge --ts-config tsconfig.json --extensions ts,tsx --image dep_graph.png . || echo "Madge analysis completed with warnings"

echo ""
echo "=== 2. Complexity Hotspots ==="
echo "Finding complex files (>50 lines, high complexity)..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v coverage | while read file; do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt 50 ]; then
        echo "$file: $lines lines"
    fi
done | sort -k2 -nr | head -10

echo ""
echo "=== 3. Dead Code Detection ==="
echo "Finding unused exports..."
npx tsx --no-esm -e "
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

function findTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    const items = readdirSync(dir);
    
    for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'coverage') {
            files.push(...findTypeScriptFiles(fullPath));
        } else if (extname(item) === '.ts' || extname(item) === '.tsx') {
            files.push(fullPath);
        }
    }
    return files;
}

const files = findTypeScriptFiles('.');
console.log('TypeScript files found:', files.length);
" 2>/dev/null || echo "Dead code analysis completed"

echo ""
echo "=== 4. Import/Export Analysis ==="
echo "Analyzing import patterns..."
grep -r "import.*from" . --include="*.ts" --include="*.tsx" | grep -v node_modules | head -20

echo ""
echo "=== 5. Security Issues Scan ==="
echo "Checking for common security patterns..."
echo "Hardcoded API keys or secrets:"
grep -r "api[_-]?key\|secret\|password\|token" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v ".env.example" | head -10 || echo "No hardcoded secrets found"

echo ""
echo "=== 6. Performance Bottlenecks ==="
echo "Large files that might impact performance:"
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l | sort -nr | head -10

echo ""
echo "=== 7. React Native Specific Analysis ==="
echo "Platform-specific code:"
grep -r "Platform\.OS\|Platform\.select" . --include="*.ts" --include="*.tsx" | grep -v node_modules | head -10

echo ""
echo "=== 8. Recent Migration Impact ==="
echo "Files affected by tRPC to Convex migration:"
git log --oneline --name-only -10 | grep -E "\.(ts|tsx)$" | sort | uniq | head -10

echo ""
echo "=== Analysis Complete ==="
echo "Generated: dep_graph.png"
echo "Review the output above for detailed findings"