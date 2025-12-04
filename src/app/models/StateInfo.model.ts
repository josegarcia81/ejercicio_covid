export class StateInfo {
    
    // Constructor
    constructor(
        private _state: string,
        private _name: string,
        private _selected: boolean = false
    ){}

    // Getters y Setters
    public get state(): string {
        return this._state;
    }
    public set state(value: string) {
        this._state = value;
    }

    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }
    public get selected(): boolean {
        return this._selected;
    }
    public set selected(value: boolean) {
        this._selected = value;
    }

}
