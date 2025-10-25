import * as React from 'react'

import NavLink from 'next/link';

export function Logo(){
    return (
        <div className="logo">

            <NavLink href="/">
                <div style={{ "display": "flex" }}>
                    <img className="NavImg" src="/favicon.png" />
                </div>
            </NavLink>
        </div>
    )
}
