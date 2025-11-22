import * as React from "react";
import AiDevelopment from './AiDevelopment';

interface FileContent {
  name: string;
  path: string; // Relative path preserving folder structure
  content: string;
}

interface GeneratedFiles {
  [filename: string]: string;
}

const FeaturePage: React.FC = () => {
  const [featureDescription, setFeatureDescription] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [showDevelopment, setShowDevelopment] = React.useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = React.useState(false);
  const [isButtonHovered, setIsButtonHovered] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = React.useState<GeneratedFiles | null>(null);
  const [fileContents, setFileContents] = React.useState<FileContent[]>([]);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Backend URL - change this if your backend runs on a different port
  const BACKEND_URL = 'http://localhost:8000';

  const steps = [
    { number: 1, title: "Upload\n& Define" },
    { number: 2, title: "AI\nDevelopment" },
    { number: 3, title: "Code\nReview" },
    { number: 4, title: "Testing" }
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Read file contents when files are uploaded
  const handleFiles = async (files: File[]) => {
    setUploadedFiles(files);
    setError(null);
    
    // Read file contents for sending to backend
    const contents: FileContent[] = [];
    
    for (const file of files) {
      // Only read text files (skip images, binaries)
      if (file.type.startsWith('text/') || 
          file.name.endsWith('.py') || 
          file.name.endsWith('.js') || 
          file.name.endsWith('.ts') ||
          file.name.endsWith('.jsx') ||
          file.name.endsWith('.tsx') ||
          file.name.endsWith('.json') ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.html') ||
          file.name.endsWith('.css') ||
          file.name.endsWith('.yaml') ||
          file.name.endsWith('.yml') ||
          file.name.endsWith('.toml') ||
          file.name.endsWith('.ini') ||
          file.name.endsWith('.conf') ||
          file.name.endsWith('.config')) {
        
        try {
          const text = await file.text();
          // Preserve folder structure using webkitRelativePath if available
          const relativePath = (file as any).webkitRelativePath || file.name;
          contents.push({
            name: file.name,
            path: relativePath,
            content: text
          });
        } catch (err) {
          console.warn(`Could not read file ${file.name}:`, err);
        }
      }
    }
    
    setFileContents(contents);
    console.log(`Read ${contents.length} text files out of ${files.length} total files`);
  };

  const handleStartDevelopment = async () => {
    // Validate inputs
    if (!featureDescription.trim()) {
      setError('Please enter a feature description');
      return;
    }
  
    setIsLoading(true);
    setError(null);
    
    // Auto-detect language from uploaded files
    const hasTypeScript = fileContents.some(f => 
      f.name.endsWith('.tsx') || 
      f.name.endsWith('.ts') || 
      f.name.endsWith('.jsx') || 
      f.name.endsWith('.js')
    );
    
    const hasPython = fileContents.some(f => 
      f.name.endsWith('.py')
    );
    
    // Check if description mentions specific file types
    const mentionsTsx = featureDescription.toLowerCase().includes('.tsx') || 
                        featureDescription.toLowerCase().includes('typescript') ||
                        featureDescription.toLowerCase().includes('react');
    const mentionsPy = featureDescription.toLowerCase().includes('.py') || 
                       featureDescription.toLowerCase().includes('python');
    
    // Determine language (prioritize based on context)
    let language = "python"; // default
    let framework = null;
    
    if (hasTypeScript || mentionsTsx) {
      language = "typescript";
      framework = "react";
    } else if (hasPython || mentionsPy) {
      language = "python";
      // Check for Python frameworks in requirements.txt if exists
      const reqFile = fileContents.find(f => f.name === 'requirements.txt');
      if (reqFile) {
        if (reqFile.content.includes('django')) framework = 'django';
        else if (reqFile.content.includes('flask')) framework = 'flask';
        else if (reqFile.content.includes('fastapi')) framework = 'fastapi';
      }
    }
    
    // Extract requested filename from description if mentioned
    const requestedFileMatch = featureDescription.match(/(?:write|create|generate|want)\s+(?:a\s+)?(\S+\.(?:tsx|ts|jsx|js|py))/i);
    const requestedFile = requestedFileMatch ? requestedFileMatch[1] : null;
    
    console.log('Starting AI Development...', { 
      featureDescription, 
      filesCount: uploadedFiles.length,
      textFilesCount: fileContents.length,
      detectedLanguage: language,
      detectedFramework: framework,
      requestedFile: requestedFile
    });
  
    try {
      // Prepare enhanced request body
      // Convert FileContent to format expected by backend (preserve path)
      const repositoryFiles = fileContents.map(fc => ({
        name: fc.path, // Use path to preserve folder structure
        content: fc.content
      }));
      
      const requestBody = {
        description: featureDescription,
        repository_files: repositoryFiles,
        language: language,
        framework: framework,
        // Add metadata to help backend understand what we want
        metadata: {
          requested_file: requestedFile,
          output_format: "raw_code", // Tell backend we want actual code, not wrapped
          file_extension: language === "typescript" ? ".tsx" : ".py"
        }
      };
  
      console.log('Request payload:', JSON.stringify(requestBody, null, 2));
  
      // Call the backend API
      const response = await fetch(`${BACKEND_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || 
          `API error: ${response.status} ${response.statusText}`
        );
      }
  
      const data = await response.json();
      
      if (data.success) {
        console.log('Code generated successfully:', data);
        
        let files = data.files || {};
        
        // Fix file extensions if backend returns wrong types
        if (language === "typescript" && Object.keys(files).some(f => f.endsWith('.py'))) {
          console.warn('Backend returned Python files for TypeScript request. Attempting to fix...');
          
          const fixedFiles: any = {};
          
          Object.entries(files).forEach(([filename, content]) => {
            // Check if this is TypeScript code wrapped in a Python file
            if (filename.endsWith('.py') && typeof content === 'string') {
              // Try to extract TypeScript code from markdown blocks
              const codeBlockMatch = content.match(/```(?:tsx?|typescript|jsx|javascript)?\n?([\s\S]*?)```/);
              
              if (codeBlockMatch) {
                // Extract the actual code
                const extractedCode = codeBlockMatch[1].trim();
                
                // Generate proper filename
                let newFilename: string;
                if (requestedFile) {
                  newFilename = requestedFile;
                } else {
                  // Try to extract component name from the code
                  const componentMatch = extractedCode.match(/(?:const|function|class)\s+(\w+)/);
                  const componentName = componentMatch ? componentMatch[1] : 'Component';
                  // Convert PascalCase to kebab-case
                  const kebabName = componentName
                    .replace(/([a-z])([A-Z])/g, '$1-$2')
                    .toLowerCase();
                  newFilename = `${kebabName}.tsx`;
                }
                
                fixedFiles[newFilename] = extractedCode;
                console.log(`Converted ${filename} to ${newFilename}`);
              } else if (content.includes('tsx') || content.includes('jsx')) {
                // The content might be TypeScript but not in markdown blocks
                // Try to clean it up
                const cleanedContent = content
                  .replace(/^.*?(?=import|const|function|class|export|interface|type|\/\/|\/\*)/s, '')
                  .trim();
                
                const newFilename = requestedFile || 'component.tsx';
                fixedFiles[newFilename] = cleanedContent;
              } else {
                // Keep original if we can't detect TypeScript
                fixedFiles[filename] = content;
              }
            } else if (filename === 'README.md' || filename.endsWith('_test.py')) {
              // Keep test files and README as is
              fixedFiles[filename] = content;
            } else {
              // For other files, check if extension matches language
              if (language === "typescript" && !filename.match(/\.(tsx?|jsx?|json|md)$/)) {
                // Wrong extension for TypeScript project
                const baseNameMatch = filename.match(/^(.+)\.\w+$/);
                const baseName = baseNameMatch ? baseNameMatch[1] : filename;
                const newFilename = `${baseName}.tsx`;
                fixedFiles[newFilename] = content;
              } else {
                fixedFiles[filename] = content;
              }
            }
          });
          
          files = fixedFiles;
          console.log('Fixed files:', Object.keys(files));
        }
        
        // Validate we got the expected file types
        const fileExtensions = Object.keys(files).map(f => f.split('.').pop());
        const hasExpectedExtensions = language === "typescript" 
          ? fileExtensions.some(ext => ['tsx', 'ts', 'jsx', 'js'].includes(ext || ''))
          : fileExtensions.some(ext => ext === 'py');
        
        if (!hasExpectedExtensions && files && Object.keys(files).length > 0) {
          console.warn(`Warning: Generated files don't match expected language (${language})`);
          setError(`Generated files don't match expected format. Check console for details.`);
        }
        
        setGeneratedCode(files);
        setShowDevelopment(true);
      } else {
        throw new Error(data.message || 'Failed to generate code');
      }
      
    } catch (err) {
      console.error('Error calling backend:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate code. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check backend status on mount
  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/generate`);
        const data = await response.json();
        console.log('Backend status:', data);
      } catch (err) {
        console.warn('Backend not reachable. Make sure it\'s running on port 8000');
      }
    };
    
    checkBackend();
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgb(226, 228, 233) 0%, rgb(50, 51, 52) 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '60px 20px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center'
    },
    headerContainer: {
      textAlign: 'center' as const,
      marginBottom: '50px'
    },
    titleWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '25px',
      marginBottom: '20px'
    },
    robotEmoji: {
      fontSize: '80px',
      animation: 'float 3s ease-in-out infinite'
    },
    title: {
      color: 'white',
      fontSize: '72px',
      fontWeight: 700,
      letterSpacing: '-1px',
      margin: 0
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '28px',
      fontWeight: 400,
      margin: 0
    },
    pipelineContainer: {
      background: 'white',
      borderRadius: '20px',
      padding: '50px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      maxWidth: '1400px',
      width: '100%',
      marginBottom: '40px'
    },
    pipelineSteps: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    step: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    stepNumber: {
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, rgb(10, 10, 11) 0%, rgb(240, 242, 246) 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '28px',
      fontWeight: 700
    },
    stepNumberActive: {
      background: 'linear-gradient(135deg, rgb(73, 132, 147) 0%, rgb(73, 132, 147)  100%)',
    },
    stepText: {
      fontSize: '24px',
      color: '#2d3748',
      fontWeight: 600,
      whiteSpace: 'pre-line' as const
    },
    arrow: {
      fontSize: '30px',
      color: '#a0aec0'
    },
    completeMarker: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    checkmark: {
      fontSize: '40px',
      color: '#48bb78'
    },
    completeText: {
      fontSize: '28px',
      color: '#2d3748',
      fontWeight: 600
    },
    uploadSection: {
      background: 'white',
      borderRadius: '20px',
      padding: '40px',
      maxWidth: '1400px',
      width: '100%',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
    },
    uploadBox: {
      background: isDragging ? '#f0f4ff' : '#f7fafc',
      border: `2px dashed ${isDragging ? '#667eea' : '#cbd5e0'}`,
      borderRadius: '16px',
      padding: '60px 40px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginBottom: '40px'
    },
    folderIcon: {
      fontSize: '64px',
      marginBottom: '20px'
    },
    uploadTitle: {
      fontSize: '28px',
      fontWeight: 600,
      color: '#2d3748',
      marginBottom: '10px'
    },
    uploadSubtitle: {
      fontSize: '18px',
      color: '#718096'
    },
    sectionTitle: {
      fontSize: '28px',
      fontWeight: 600,
      color: '#2d3748',
      marginBottom: '20px'
    },
    textareaContainer: {
      position: 'relative' as const
    },
    textarea: {
      width: '100%',
      minHeight: '300px',
      padding: '20px',
      fontSize: '18px',
      fontFamily: 'monospace',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      resize: 'vertical' as const,
      background: '#f7fafc',
      color: '#4a5568',
      lineHeight: '1.6',
      transition: 'border-color 0.3s ease',
      outline: 'none'
    },
    textareaFocused: {
      borderColor: '#667eea',
      background: '#ffffff'
    },
    startButton: {
      background: isLoading 
        ? 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)'
        : 'linear-gradient(135deg, rgb(36, 8, 222) 0%,rgb(36, 8, 222)100%)',
      color: 'white',
      fontSize: '20px',
      fontWeight: 600,
      padding: '16px 40px',
      borderRadius: '12px',
      border: 'none',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginTop: '30px',
      boxShadow: '0 4px 15px rgba(60, 76, 145, 0.4)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      opacity: isLoading ? 0.7 : 1
    },
    startButtonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(8, 50, 236, 0.5)'
    },
    developmentWrapper: {
      maxWidth: '1400px',
      width: '100%'
    },
    errorMessage: {
      background: '#fed7d7',
      color: '#c53030',
      padding: '12px 20px',
      borderRadius: '8px',
      marginTop: '20px',
      fontSize: '16px',
      fontWeight: 500
    },
    successMessage: {
      background: '#c6f6d5',
      color: '#22543d',
      padding: '12px 20px',
      borderRadius: '8px',
      marginTop: '20px',
      fontSize: '16px',
      fontWeight: 500
    },
    fileList: {
      marginTop: '20px',
      padding: '15px',
      background: '#f7fafc',
      borderRadius: '8px',
      maxHeight: '200px',
      overflowY: 'auto' as const
    },
    fileItem: {
      fontSize: '14px',
      color: '#4a5568',
      padding: '4px 0'
    }
  };

  const placeholderText = `Describe the feature you want to build in detail...

Example:
- Add user authentication with JWT tokens
- Implement a dashboard with real-time analytics
- Create REST API endpoints for user management
- Add email notification system`;

  const getActiveStep = () => {
    if (showDevelopment) return 2;
    return 1;
  };

  const activeStep = getActiveStep();

  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      textarea::placeholder {
        color: #a0aec0;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <div style={styles.titleWrapper}>
          <span style={styles.robotEmoji}>🤖</span>
          <h1 style={styles.title}>AI Feature Development Agent</h1>
        </div>
        <p style={styles.subtitle}>Automated feature development, review, and testing pipeline</p>
      </div>

      <div style={styles.pipelineContainer}>
        <div style={styles.pipelineSteps}>
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div style={styles.step}>
                <div style={{
                  ...styles.stepNumber,
                  ...(activeStep === step.number ? styles.stepNumberActive : {})
                }}>
                  {step.number}
                </div>
                <div style={styles.stepText}>{step.title}</div>
              </div>
              {index < steps.length - 1 && <span style={styles.arrow}>→</span>}
            </React.Fragment>
          ))}
          <span style={styles.arrow}>→</span>
          <div style={styles.completeMarker}>
            <span style={styles.checkmark}>✓</span>
            <span style={styles.completeText}>Complete</span>
          </div>
        </div>
      </div>

      {!showDevelopment ? (
        <div style={styles.uploadSection}>
          <div
            style={styles.uploadBox}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              {...({ webkitdirectory: '', directory: '' } as any)}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div style={styles.folderIcon}>📁</div>
            <div style={styles.uploadTitle}>Upload Repository</div>
            <div style={styles.uploadSubtitle}>
              Click to browse a folder, or drag and drop files/folders
            </div>
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#48bb78', fontSize: '18px', marginBottom: '10px' }}>
                  ✓ {uploadedFiles.length} files uploaded ({fileContents.length} readable)
                </div>
                <div style={styles.fileList}>
                  {fileContents.slice(0, 20).map((fileContent, index) => (
                    <div key={index} style={styles.fileItem}>
                      {fileContent.path !== fileContent.name ? (
                        <span style={{ color: '#667eea', fontFamily: 'monospace', fontSize: '12px' }}>
                          📁 {fileContent.path}
                        </span>
                      ) : (
                        <span>{fileContent.name}</span>
                      )}
                    </div>
                  ))}
                  {fileContents.length > 20 && (
                    <div style={styles.fileItem}>... and {fileContents.length - 20} more files</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 style={styles.sectionTitle}>Feature Description</h2>
            <div style={styles.textareaContainer}>
              <textarea
                value={featureDescription}
                onChange={(e) => setFeatureDescription(e.target.value)}
                placeholder={placeholderText}
                style={{
                  ...styles.textarea,
                  ...(isTextareaFocused ? styles.textareaFocused : {})
                }}
                onFocus={() => setIsTextareaFocused(true)}
                onBlur={() => setIsTextareaFocused(false)}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}

          <button
            style={{
              ...styles.startButton,
              ...(isButtonHovered && !isLoading ? styles.startButtonHover : {})
            }}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            onClick={handleStartDevelopment}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span>⏳</span>
                <span>Generating Code...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Start AI Development</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div style={styles.developmentWrapper}>
          <AiDevelopment 
            featureDescription={featureDescription}
            uploadedFiles={uploadedFiles}
            generatedCode={generatedCode}
          />
        </div>
      )}
    </div>
  );
};

export default FeaturePage;