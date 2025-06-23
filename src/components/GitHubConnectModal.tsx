import React from 'react';

// This component is no longer needed as GitHub repo is pre-configured
// Keeping as placeholder for future use if needed

interface GitHubConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (repoUrl: string) => void;
  currentRepo?: string;
}

const GitHubConnectModal: React.FC<GitHubConnectModalProps> = ({ 
  isOpen, 
  onClose, 
  onConnect, 
  currentRepo 
}) => {
  // Return null as this component is not being used anymore
  // The GitHub repository is pre-configured in the main application
  return null;
};

export default GitHubConnectModal;
