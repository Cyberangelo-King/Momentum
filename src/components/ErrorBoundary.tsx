import React, { ErrorInfo, ReactNode } from 'react';
import { downloadEmergencyBackup } from '../services/contingencyService';
import { AlertTriangle, Download, RefreshCw, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToSafeState = () => {
    // Return to root home safely
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0502] text-[#fadcd2] flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-[#180b06] border border-[#FF5C00]/40 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF5C00]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] px-3 py-1 rounded-full bg-[#25D366]/20 text-[#25D366] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>All Event Data Preserved</span>
              </span>
              <h1 className="text-2xl font-bold font-serif-display text-white">
                Contingency Recovery Mode
              </h1>
              <p className="text-xs text-[#e4beb1]/80 leading-relaxed">
                An interface error occurred, but your local contacts, captured moments, and talk notes are safely cached in local storage.
              </p>
            </div>

            {/* Error detail (subtle) */}
            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-[11px] font-mono text-[#ffb59a] text-left max-h-24 overflow-y-auto">
                {this.state.error.message || 'Unknown runtime exception'}
              </div>
            )}

            {/* Emergency Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => downloadEmergencyBackup()}
                className="w-full py-3.5 rounded-2xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C00]/20 active:scale-95"
              >
                <Download className="w-4 h-4 fill-current" />
                <span>Download Emergency JSON Backup</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={this.handleReload}
                  className="py-3 rounded-2xl bg-[#281309] hover:bg-[#381a0d] text-[#fadcd2] font-semibold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#FF5C00]" />
                  <span>Reload App</span>
                </button>

                <button
                  onClick={this.handleResetToSafeState}
                  className="py-3 rounded-2xl bg-[#281309] hover:bg-[#381a0d] text-[#fadcd2] font-semibold text-xs border border-white/10 transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
