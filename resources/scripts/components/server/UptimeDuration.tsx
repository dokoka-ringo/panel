import React from 'react';

export default ({ uptime }: { uptime: number }) => {
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((Math.floor(uptime) / 60 / 60) % 24);
    const remainder = Math.floor(uptime - hours * 60 * 60);
    const minutes = Math.floor((remainder / 60) % 60);
    const seconds = remainder % 60;

    if (days > 0) {
        return (
            <>
                {days}日 {hours}時間 {minutes}分
            </>
        );
    }

    return (
        <>
            {hours}時間 {minutes}分 {seconds}秒
        </>
    );
};
