import React, { useContext, useEffect, useState } from 'react';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import getTwoFactorTokenData, { TwoFactorTokenData } from '@/api/account/getTwoFactorTokenData';
import { useFlashKey } from '@/plugins/useFlash';
import tw from 'twin.macro';
import QRCode from 'qrcode.react';
import { Button } from '@/components/elements/button/index';
import Spinner from '@/components/elements/Spinner';
import { Input } from '@/components/elements/inputs';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import enableAccountTwoFactor from '@/api/account/enableAccountTwoFactor';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import asDialog from '@/hoc/asDialog';

interface Props {
    onTokens: (tokens: string[]) => void;
}

const ConfigureTwoFactorForm = ({ onTokens }: Props) => {
    const [submitting, setSubmitting] = useState(false);
    const [value, setValue] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState<TwoFactorTokenData | null>(null);
    const { clearAndAddHttpError } = useFlashKey('account:two-step');
    const updateUserData = useStoreActions((actions: Actions<ApplicationStore>) => actions.user.updateUserData);

    const { close, setProps } = useContext(DialogWrapperContext);

    useEffect(() => {
        getTwoFactorTokenData()
            .then(setToken)
            .catch((error) => clearAndAddHttpError(error));
    }, []);

    useEffect(() => {
        setProps((state) => ({ ...state, preventExternalClose: submitting }));
    }, [submitting]);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (submitting) return;

        setSubmitting(true);
        clearAndAddHttpError();
        enableAccountTwoFactor(value, password)
            .then((tokens) => {
                updateUserData({ useTotp: true });
                onTokens(tokens);
            })
            .catch((error) => {
                clearAndAddHttpError(error);
                setSubmitting(false);
            });
    };

    return (
        <form id={'enable-totp-form'} onSubmit={submit}>
            <FlashMessageRender byKey={'account:two-step'} className={'mt-4'} />
            <div className={'flex items-center justify-center w-56 h-56 p-2 bg-gray-50 shadow mx-auto mt-6'}>
                {!token ? (
                    <Spinner />
                ) : (
                    <QRCode renderAs={'svg'} value={token.image_url_data} css={tw`w-full h-full shadow-none`} />
                )}
            </div>
            <CopyOnClick text={token?.secret}>
                <p className={'font-mono text-sm text-gray-100 text-center mt-2'}>
                    {token?.secret.match(/.{1,4}/g)!.join(' ') || 'Loading...'}
                </p>
            </CopyOnClick>
            <p id={'totp-code-description'} className={'mt-6'}>
            選択した2段階認証アプリを使用して、上記のQRコードをスキャンします。次に、下のフィールドに生成された6桁のコードを入力します。
            </p>
            <Input.Text
                aria-labelledby={'totp-code-description'}
                variant={Input.Text.Variants.Loose}
                value={value}
                onChange={(e) => setValue(e.currentTarget.value)}
                className={'mt-3'}
                placeholder={'000000'}
                type={'text'}
                inputMode={'numeric'}
                autoComplete={'one-time-code'}
                pattern={'\\d{6}'}
            />
            <label htmlFor={'totp-password'} className={'block mt-3'}>
                アカウントパスワード
            </label>
            <Input.Text
                variant={Input.Text.Variants.Loose}
                className={'mt-1'}
                type={'password'}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Dialog.Footer>
                <Button.Text onClick={close}>キャンセル</Button.Text>
                <Tooltip
                    disabled={password.length > 0 && value.length === 6}
                    content={
                        !token
                            ? 'QRコードがロードされるのを待っています...'
                            : '続行するには、6桁のコードとパスワードを入力する必要があります。'
                    }
                    delay={100}
                >
                    <Button
                        disabled={!token || value.length !== 6 || !password.length}
                        type={'submit'}
                        form={'enable-totp-form'}
                    >
                        有効にする
                    </Button>
                </Tooltip>
            </Dialog.Footer>
        </form>
    );
};

export default asDialog({
    title: '2段階認証を有効にします',
    description:
        "不正アクセスからアカウントを保護してください。サインインするたびに認証コードが求められます。",
})(ConfigureTwoFactorForm);
