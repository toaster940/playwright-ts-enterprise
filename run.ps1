param([Parameter(Position=0)][string]$Task = 'test', [Parameter(ValueFromRemainingArguments=$true)][string[]]$TaskArgs)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { $null }
if (!$nodePath -or [int]((& $nodePath --version) -replace '^v(\d+).*','$1') -lt 24) {
  $bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  if (Test-Path -LiteralPath $bundledNode) { $nodePath = $bundledNode }
  else { throw 'Install Node.js 24 LTS, reopen PowerShell, and retry.' }
}
$env:PATH = (Split-Path -Parent $nodePath) + [IO.Path]::PathSeparator + $env:PATH
$npmCommand = Get-Command npm.cmd -ErrorAction Stop
$npmCli = Join-Path (Split-Path -Parent $npmCommand.Source) 'node_modules\npm\bin\npm-cli.js'
if (!(Test-Path -LiteralPath $npmCli)) { throw 'npm CLI not found. Install Node.js 24 LTS with npm.' }
if ($Task -in @('mcp', 'mcp:browser')) {
  $mcpMode = if ($Task -eq 'mcp') { 'mcp' } else { 'browser' }
  & $nodePath 'scripts/launch.cjs' $mcpMode @TaskArgs
  exit $LASTEXITCODE
}
Write-Host "Using $(& $nodePath --version) at $nodePath for $Task"
if ($Task -eq 'setup') {
  & $nodePath $npmCli ci
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & $nodePath 'node_modules/@playwright/test/cli.js' install chromium firefox webkit
} else { & $nodePath $npmCli run $Task -- @TaskArgs }
exit $LASTEXITCODE
