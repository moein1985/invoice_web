'use client';

import { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSIP } from '@/hooks/use-sip';

interface PhoneDialerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhoneNumber?: string;
  customerName?: string;
}

export function PhoneDialer({ isOpen, onClose, initialPhoneNumber = '', customerName }: PhoneDialerProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  
  // Note: در محیط واقعی، اطلاعات SIP را از environment variables بخوانید
  const sipConfig = {
    sipServer: process.env.NEXT_PUBLIC_SIP_SERVER || '',
    sipUser: process.env.NEXT_PUBLIC_SIP_USER || '',
    sipPassword: process.env.NEXT_PUBLIC_SIP_PASSWORD || '',
    sipDomain: process.env.NEXT_PUBLIC_SIP_DOMAIN || '',
  };

  const { makeCall, hangup, toggleMute, currentCall, isMuted, registered } = useSIP(
    sipConfig.sipServer ? sipConfig : undefined
  );

  const handleCall = () => {
    if (phoneNumber) {
      makeCall(phoneNumber);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تماس تلفنی</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* SIP Status */}
          {sipConfig.sipServer && (
            <div className="flex items-center gap-2 text-sm">
              <div className={`h-2 w-2 rounded-full ${registered ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{registered ? 'متصل' : 'قطع شده'}</span>
            </div>
          )}

          {/* Customer Info */}
          {customerName && (
            <div className="text-center">
              <p className="text-lg font-semibold">{customerName}</p>
            </div>
          )}

          {/* Phone Number Input */}
          {!currentCall && (
            <Input
              type="tel"
              placeholder="شماره تلفن"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-center text-lg"
              dir="ltr"
            />
          )}

          {/* Call Status */}
          {currentCall && (
            <div className="text-center space-y-2">
              <p className="text-xl font-mono" dir="ltr">
                {currentCall.phoneNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentCall.status === 'connecting' && 'در حال اتصال...'}
                {currentCall.status === 'ringing' && 'در حال زنگ خوردن...'}
                {currentCall.status === 'connected' && 'متصل'}
                {currentCall.status === 'ended' && 'تماس پایان یافت'}
              </p>
              {currentCall.status === 'connected' && (
                <p className="text-2xl font-mono">
                  {formatDuration(currentCall.duration)}
                </p>
              )}
            </div>
          )}

          {/* Call Controls */}
          <div className="flex justify-center gap-4">
            {!currentCall ? (
              <>
                <Button
                  size="lg"
                  onClick={handleCall}
                  disabled={!phoneNumber || !sipConfig.sipServer || !registered}
                  className="rounded-full h-16 w-16"
                  aria-label="call"
                >
                  <Phone className="h-6 w-6" />
                </Button>
                {!sipConfig.sipServer && (
                  <p className="text-xs text-muted-foreground text-center">
                    تنظیمات SIP یافت نشد
                  </p>
                )}
              </>
            ) : (
              <>
                {currentCall.status === 'connected' && (
                  <Button
                    size="lg"
                    variant={isMuted ? 'default' : 'outline'}
                    onClick={toggleMute}
                    className="rounded-full h-16 w-16"
                    aria-label={isMuted ? "unmute" : "mute"}
                  >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={hangup}
                  className="rounded-full h-16 w-16"
                  aria-label="hangup"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Demo Mode Notice */}
          {!sipConfig.sipServer && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">حالت نمایشی</p>
              <p className="text-muted-foreground">
                برای فعال کردن تماس واقعی، تنظیمات SIP را در environment variables مشخص کنید:
              </p>
              <ul className="list-disc list-inside mt-2 text-xs text-muted-foreground">
                <li>NEXT_PUBLIC_SIP_SERVER</li>
                <li>NEXT_PUBLIC_SIP_USER</li>
                <li>NEXT_PUBLIC_SIP_PASSWORD</li>
                <li>NEXT_PUBLIC_SIP_DOMAIN</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
