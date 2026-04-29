import styles from "./button.module.css"
import React from "react";

export interface ButtonProps{
    children: string;
    onClick?: ()=> void;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export default function Button(props: ButtonProps){

    return(
        <div className={`${styles.buttonContainer} ${props.disabled ? styles.disabled : ""}`} 
            onClick={props.disabled ? undefined: props.onClick}
            style={props.style}>            
                {props.children}                         
        </div>
    );
}