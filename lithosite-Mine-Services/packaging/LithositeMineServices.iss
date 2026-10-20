#define AppName "Lithosite Mine Services"
#define AppVersion "1.0.0"
#define AppPublisher "Lithosite"
#define AppExe "LithositeMineServices.exe"
[Setup]
AppId={{B9DCD1A1-87E2-4AB2-8B7B-51A21D8D5C7E}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\Lithosite\Mine Services
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputDir=..\dist-installer
OutputBaseFilename=Lithosite-Mine-Services-Setup-{#AppVersion}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
SetupIconFile=..\\..\\lithosite-Mine-Geologist\\assets\\favicon.ico
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
[Files]
Source: "..\dist\LithositeMineServices\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs
Source: "redist\MicrosoftEdgeWebView2RuntimeInstallerX64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall
[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon
[Tasks]
Name: "desktopicon"; Description: "Create a Desktop shortcut"; GroupDescription: "Additional shortcuts:"
[Run]
Filename: "{tmp}\MicrosoftEdgeWebView2RuntimeInstallerX64.exe"; Parameters: "/silent /install"; StatusMsg: "Installing the WebView2 runtime for offline desktop use..."; Flags: waituntilterminated
[Code]
function InitializeSetup(): Boolean;
begin
  if not FileExists(ExpandConstant('{src}\redist\MicrosoftEdgeWebView2RuntimeInstallerX64.exe')) then
  begin
    MsgBox('The offline WebView2 runtime installer is missing from packaging\redist. The installer cannot be built for offline use until it is supplied.', mbCriticalError, MB_OK);
    Result := False;
    exit;
  end;
  Result := True;
end;
