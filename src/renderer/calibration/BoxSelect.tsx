import Button from "../components/Button";
import styles from "./BoxSelect.module.css"

export type Props = {

}

export default function BoxSelect(props: Props){

    return(
        <div className={styles.container}>
            <Button>Suma celkem</Button>
            <Button>Čas</Button>
            <Button>Počet hodů</Button>
            <Button>Spadené</Button>
            <Button>Suma dráhy</Button>
        </div>
    );
}