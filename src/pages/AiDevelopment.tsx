import * as React from "react";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";

import SpaceBetween from "@cloudscape-design/components/space-between";


const AiDevelopment: React.FC = () => {
  const [progress, setProgress] = React.useState(0);
  const [currentStatus, setCurrentStatus] = React.useState("INITIALIZING");
  const [activityLogs, setActivityLogs] = React.useState<Array<{
    time: string;
    message: string;
    status: 'success' | 'in-progress' | 'pending';
  }>>([]);

  // Simulate progress
  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 65) {
          clearInterval(interval);
          return 65;
        }
        return prev + 1;
      });
    }, 100);

    // Simulate activity logs
    const timeout1 = setTimeout(() => {
      setActivityLogs(logs => [...logs, {
        time: "[10:23:45]",
        message: "Model initialized",
        status: 'success'
      }]);
    }, 1000);

    const timeout2 = setTimeout(() => {
      setActivityLogs(logs => [...logs, {
        time: "[10:23:46]",
        message: "Context analyzed",
        status: 'success'
      }]);
    }, 2000);

    const timeout3 = setTimeout(() => {
      setCurrentStatus("GENERATING");
      setActivityLogs(logs => [...logs, {
        time: "[10:23:47]",
        message: "Generating code structure...",
        status: 'in-progress'
      }]);
    }, 3000);

    const timeout4 = setTimeout(() => {
      setActivityLogs(logs => [...logs, {
        time: "[10:23:48]",
        message: "Writing implementation...",
        status: 'in-progress'
      }]);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
    };
  }, []);

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    developmentBox: {
      border: '2px dashed #879596',
      borderRadius: '8px',
      padding: '30px',
      background: '#ffffff'
    },
    statusBadge: {
      position: 'relative' as const,
      display: 'inline-flex',
      alignItems: 'center',
      background: '#ffd700',
      padding: '8px 20px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: 700,
      letterSpacing: '1px',
      color: '#000000',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    progressContainer: {
      marginBottom: '30px'
    },
    activityLog: {
      background: '#f9fafb',
      borderRadius: '8px',
      padding: '20px',
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      fontSize: '14px',
      lineHeight: '1.8'
    },
    logEntry: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px',
      color: '#4a5568'
    },
    logTime: {
      color: '#718096',
      marginRight: '12px'
    },
    logIcon: {
      marginRight: '8px',
      fontSize: '16px'
    },
    headerText: {
      fontSize: '16px',
      fontWeight: 700,
      letterSpacing: '2px',
      color: '#718096'
    },
    customProgressBar: {
      background: '#e2e8f0',
      borderRadius: '4px',
      height: '40px',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    progressFill: {
      background: 'repeating-linear-gradient(45deg, #4299e1, #4299e1 10px, #63b3ed 10px, #63b3ed 20px)',
      height: '100%',
      transition: 'width 0.3s ease',
      borderRadius: '4px'
    },
    progressText: {
      position: 'absolute' as const,
      right: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '18px',
      fontWeight: 700,
      color: '#2d3748'
    },
    statusText: {
      marginLeft: '10px',
      fontSize: '16px'
    }
  };

  const getLogIcon = (status: string) => {
    switch(status) {
      case 'success': return '✓';
      case 'in-progress': return '➤';
      default: return '○';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.developmentBox}>
        <div style={styles.headerText}>DEVELOPMENT PROGRESS</div>
        
        <SpaceBetween size="l">
          <div>
            <div style={styles.statusBadge}>
              <span>{currentStatus}</span>
            </div>
            {currentStatus === "GENERATING" && (
              <Box color="text-body-secondary" fontSize="body-m">
                Choose between models based on requirements...
              </Box>
            )}
          </div>

          <div style={styles.progressContainer}>
            <div style={styles.customProgressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${progress}%`
                }}
              />
              <div style={styles.progressText}>{progress}%</div>
            </div>
          </div>

          <Container
            header={
              <Header variant="h3">
                <Box display="inline" >
                  <span>📋</span>
                  <span style={{ marginLeft: '8px' }}>ACTIVITY LOG</span>
                </Box>
              </Header>
            }
          >
            <div style={styles.activityLog}>
              {activityLogs.map((log, index) => (
                <div key={index} style={styles.logEntry}>
                  <span style={styles.logTime}>{log.time}</span>
                  <span style={styles.logIcon}>{getLogIcon(log.status)}</span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </Container>
        </SpaceBetween>
      </div>
    </div>
  );
};

export default AiDevelopment;