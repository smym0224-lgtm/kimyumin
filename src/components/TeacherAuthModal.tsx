import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, X, Check, Settings } from 'lucide-react';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPin: string;
  onChangePin: (newPin: string) => void;
  title?: string;
  description?: string;
  confirmButtonText?: string;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPin,
  onChangePin,
  title = '교사용 권한 인증',
  description = '선생님 전용 인증을 거쳐야 수첩 열람 및 타이머 제어가 가능합니다.',
  confirmButtonText = '인증 완료하기'
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [oldPinInput, setOldPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === currentPin) {
      setErrorMsg(null);
      setPinInput('');
      onSuccess();
    } else {
      setErrorMsg('비밀번호가 올바르지 않습니다. 다시 입력해 주세요.');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPinInput !== currentPin) {
      setErrorMsg('현재(기존) 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
      return;
    }
    if (newPinInput.length < 4) {
      setErrorMsg('새 비밀번호는 4자리 이상이어야 합니다.');
      return;
    }
    if (newPinInput === oldPinInput) {
      setErrorMsg('새 비밀번호는 기존 비밀번호와 다르게 설정해 주세요.');
      return;
    }
    if (newPinInput !== confirmNewPin) {
      setErrorMsg('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    onChangePin(newPinInput);
    setIsChangingPin(false);
    setOldPinInput('');
    setNewPinInput('');
    setConfirmNewPin('');
    setErrorMsg(null);
    setSuccessNotice('비밀번호가 성공적으로 변경되었습니다!');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border-2 border-indigo-200 max-w-md w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500">
              {description}
            </p>
          </div>
        </div>

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!isChangingPin ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>교사용 비밀번호 (PIN)</span>
              </label>
              <input
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="비밀번호를 입력하세요 (기본: 1030)"
                className="w-full px-4 py-3 text-sm rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none transition tracking-widest font-mono text-center text-lg"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                * 링크를 공유받은 학생들은 비밀번호를 알 수 없어 접근 및 조작이 차단됩니다.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{confirmButtonText}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(true);
                  setErrorMsg(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1 py-1"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>비밀번호 변경하기</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePinSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>현재(기존) 비밀번호 확인</span>
                <span className="text-[11px] text-rose-500 font-semibold">* 필수 확인</span>
              </label>
              <input
                type="password"
                autoFocus
                value={oldPinInput}
                onChange={(e) => {
                  setOldPinInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="현재 교사용 비밀번호 입력"
                className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                새 교사용 비밀번호 (4자리 이상)
              </label>
              <input
                type="password"
                value={newPinInput}
                onChange={(e) => {
                  setNewPinInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="새 비밀번호 입력"
                className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmNewPin}
                onChange={(e) => {
                  setConfirmNewPin(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="새 비밀번호 다시 입력"
                className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setOldPinInput('');
                  setNewPinInput('');
                  setConfirmNewPin('');
                  setErrorMsg(null);
                }}
                className="w-1/2 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 text-xs font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition cursor-pointer"
              >
                비밀번호 변경
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
