import React, { type ReactNode } from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@site/src/stores/hooks';
import Link from '@docusaurus/Link';
import {default as BadgeComponent} from '../../shared/Badge';
import Button from '../../shared/Button';
import { mdiAccountCircleOutline } from '@mdi/js';

const LoginProfileButton = observer(() => {
    const userStore = useStore('userStore');
    if (userStore.current) {
        return (
            <Button
                text={userStore.current.shortName || userStore.current.firstName}
                icon={mdiAccountCircleOutline}
                iconSide='left'
                color='primary'
                href='/user'
                title='Persönlicher Bereich'
            />
        )
    }
    return (
        <div className={clsx(styles.login)}>
            <Link to={'/login'}>Login 🔑</Link>
        </div>
    )
});

export default LoginProfileButton;