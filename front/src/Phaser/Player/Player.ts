import {getPlayerAnimations, playAnimation, PlayerAnimationNames} from "./Animation";
import {GameSceneInterface, Textures} from "../Game/GameScene";
import {ConnexionInstance} from "../Game/GameManager";
import {MessageUserPositionInterface} from "../../Connexion";
import {ActiveEventList, UserInputEvent, UserInputManager} from "../UserInput/UserInputManager";
import {PlayableCaracter} from "../Entity/PlayableCaracter";

export interface CurrentGamerInterface extends PlayableCaracter{
    userId : string;
    PlayerValue : string;
    initAnimation() : void;
    moveUser(delta: number) : void;
    say(text : string) : void;
}

export interface GamerInterface extends PlayableCaracter{
    userId : string;
    PlayerValue : string;
    initAnimation() : void;
    updatePosition(MessageUserPosition : MessageUserPositionInterface) : void;
    say(text : string) : void;
}

export class Player extends PlayableCaracter implements CurrentGamerInterface, GamerInterface {
    userId: string;
    PlayerValue: string;
    userInputManager: UserInputManager;

    constructor(
        userId: string,
        Scene: GameSceneInterface,
        x: number,
        y: number,
        PlayerValue: string = Textures.Player
    ) {
        super(Scene, x, y, PlayerValue, 1);

        //create input to move
        this.userInputManager = new UserInputManager(Scene);

        //set data
        this.userId = userId;
        this.PlayerValue = PlayerValue;

        //the current player model should be push away by other players to prevent conflict
        this.setImmovable(false);
    }

    initAnimation(): void {
        getPlayerAnimations().forEach(d => {
            this.scene.anims.create({
                key: d.key,
                frames: this.scene.anims.generateFrameNumbers(d.frameModel, {start: d.frameStart, end: d.frameEnd}),
                frameRate: d.frameRate,
                repeat: d.repeat
            });
        })
    }

    moveUser(delta: number): void {
        //if user client on shift, camera and player speed
        let haveMove = false;
        let direction = null;

        let activeEvents = this.userInputManager.getEventListForGameTick();
        let speedMultiplier = activeEvents.get(UserInputEvent.SpeedUp) ? 25 : 9;
        let moveAmount = speedMultiplier * delta;

        let x = 0;
        let y = 0;
        if (activeEvents.get(UserInputEvent.MoveUp)) {
            y = - moveAmount;
            direction = PlayerAnimationNames.WalkUp;
        } else if (activeEvents.get(UserInputEvent.MoveDown)) {
            y = moveAmount;
            direction = PlayerAnimationNames.WalkDown;
        }
        if (activeEvents.get(UserInputEvent.MoveLeft)) {
            x = -moveAmount;
            direction = PlayerAnimationNames.WalkLeft;
        } else if (activeEvents.get(UserInputEvent.MoveRight)) {
            x = moveAmount;
            direction = PlayerAnimationNames.WalkRight;
        }
        if (x !== 0 || y !== 0) {
            this.move(x, y);
        } else {
            direction = PlayerAnimationNames.None;
            this.stop();
        }
        this.sharePosition(direction);
    }

    private sharePosition(direction: string) {
        if (ConnexionInstance) {
            ConnexionInstance.sharePosition(this.x, this.y, direction);
        }
    }

    updatePosition(MessageUserPosition: MessageUserPositionInterface) {
        playAnimation(this, MessageUserPosition.position.direction);
        this.setX(MessageUserPosition.position.x);
        this.setY(MessageUserPosition.position.y);
    }
}