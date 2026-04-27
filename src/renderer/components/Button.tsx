import styles from "./button.module.css"

export interface ButtonProps{
    children: string;
    onClick?: ()=> void;
}

export default function Button(props: ButtonProps){

    return(
        <div className={styles.buttonContainer} onClick={props.onClick}>            
                {props.children}                         
        </div>
    );
}