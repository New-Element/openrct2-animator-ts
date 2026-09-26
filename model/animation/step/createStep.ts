import {
    BannerColoursStepDesc,
    BannerNoEntryStepDesc,
    BannerTextStepDesc,
    BlockBrakeStepDesc,
    BranchStepDesc,
    CarCoordsOverTimeStepDesc,
    CarEditColourStepDesc,
    CarMoveToTrackStepDesc,
    CarNumberStepDesc,
    CarStatusStepDesc,
    CarToggleStepDesc,
    ClearAwardsStepDesc,
    ContextMutateStepDesc,
    CustomJavascriptStepDesc,
    EdgeStyleStepDesc,
    FreezeWeatherStepDesc,
    GamePauseStepDesc,
    GameSpeedStepDesc,
    GrantAwardStepDesc,
    GrassLengthStepDesc,
    GuestAnimationStepDesc,
    GuestClothesStepDesc,
    GuestFavouriteRideStepDesc,
    GuestFlagStepDesc,
    GuestItemStepDesc,
    GuestMoveStepDesc,
    GuestNeedStepDesc,
    LandHeightStepDesc,
    LandSlopeStepDesc,
    LiftDropTrackStepDesc,
    ParkCashStepDesc,
    ParkDateStepDesc,
    ParkMessageStepDesc,
    ParkRatingStepDesc,
    PathAdditionVandalisedStepDesc,
    PathBinFullStepDesc,
    PathLitterStepDesc,
    RideBreakdownStepDesc,
    RideFixBreakdownStepDesc,
    RideMusicStepDesc,
    RideNumberStepDesc,
    RideStationStartStepDesc,
    RideStatusStepDesc,
    RideTrackColoursStepDesc,
    RideVehicleColoursStepDesc,
    SceneryRecolourStepDesc,
    SceneryRotationStepDesc,
    SceneryVisibilityStepDesc,
    SetCarCoordsStepDesc,
    SetStaffCoordsStepDesc,
    SpawnGuestStepDesc,
    StaffAnimationStepDesc,
    StaffCostumeStepDesc,
    StaffFlagStepDesc,
    StaffOrdersStepDesc,
    StaffPatrolStepDesc,
    StepDesc,
    StepDescBase,
    SurfaceStyleStepDesc,
    SwitchTiTrackOrderStepDesc,
    TrackBrakeSpeedStepDesc,
    TrackChainLiftStepDesc,
    TrackColourSchemeStepDesc,
    TrackHighlightedStepDesc,
    TrackInvertedStepDesc,
    TrackSeatRotationStepDesc,
    TrackSetHeightStepDesc,
    TrainCoordsOverTimeStepDesc,
    TrainEditColourStepDesc,
    VariableDecrementStepDesc,
    VariableIncrementStepDesc,
    VariableRandomIntStepDesc,
    VariableSetStepDesc,
    ViewportCameraStepDesc,
    WaitStepDesc,
    WaterHeightStepDesc,
    WriteCameraRotationStepDesc,
    WriteCarCoordsStepDesc,
    WriteCarTrackDirectionStepDesc,
    WriteGuestCoordsStepDesc,
    WriteGuestDirectionStepDesc,
    WriteStaffCoordsStepDesc,
    WriteStaffDirectionStepDesc,
    WriteTriggerTileStepDesc
} from "../jsonTypes";
import CarCoordsOverTimeStep from "./car/carCoordsOverTimeStep";
import CarEditColourStep from "./car/carEditColourStep";
import {
    CarMoveToTrackStep,
    CarNumberStep,
    CarStatusStep,
    CarToggleStep
} from "./car/carPropertySteps";
import TrainCoordsOverTimeStep from "./car/trainCoordsOverTimeStep";
import TrainEditColourStep from "./car/trainEditColourStep";
import {
    GuestAnimationStep,
    GuestClothesStep,
    GuestFavouriteRideStep,
    GuestFlagStep,
    GuestItemStep,
    GuestMoveStep,
    GuestNeedStep
} from "./guest/guestPropertySteps";
import {
    EdgeStyleStep,
    GrassLengthStep,
    LandHeightStep,
    LandSlopeStep,
    SurfaceStyleStep,
    WaterHeightStep
} from "./land/surfaceSteps";
import {
    PathAdditionVandalisedStep,
    PathBinFullStep,
    PathLitterStep
} from "./land/pathSteps";
import {
    ClearAwardsStep,
    FreezeWeatherStep,
    GamePauseStep,
    GameSpeedStep,
    GrantAwardStep,
    ParkCashStep,
    ParkDateStep,
    ParkMessageStep,
    ParkRatingStep,
    SpawnGuestStep,
    ViewportCameraStep
} from "./park/parkSteps";
import {
    RideBreakdownStep,
    RideFixBreakdownStep,
    RideMusicStep,
    RideNumberStep,
    RideStatusStep,
    RideTrackColoursStep,
    RideVehicleColoursStep
} from "./ride/ridePropertySteps";
import {RideStationStartStep} from "./ride/rideStationStartStep";
import BranchStep from "./branchStep";
import {BannerColoursStep, BannerNoEntryStep, BannerTextStep} from "./scenery/bannerSteps";
import SceneryRecolourStep from "./scenery/sceneryRecolourStep";
import SceneryRotationStep from "./scenery/sceneryRotationStep";
import SceneryVisibilityStep from "./scenery/sceneryVisibilityStep";
import {
    StaffAnimationStep,
    StaffCostumeStep,
    StaffFlagStep,
    StaffOrdersStep,
    StaffPatrolStep
} from "./staff/staffPropertySteps";
import {SetCarCoordsStep, SetStaffCoordsStep} from "./applyCoordsSteps";
import ContextMutateStep from "./contextMutateStep";
import CustomJavascriptStep from "./customJavascriptStep";
import Step from "./step";
import LiftDropTrackStep from "./track/liftDropTrackStep";
import SwitchTiTrackOrderStep from "./track/switchTiTrackOrderStep";
import TrackChainLiftStep from "./track/trackChainLiftStep";
import {
    BlockBrakeStep,
    TrackBrakeSpeedStep,
    TrackColourSchemeStep,
    TrackHighlightedStep,
    TrackInvertedStep,
    TrackSeatRotationStep
} from "./track/trackPropertySteps";
import TrackSetHeightStep from "./track/trackSetHeightStep";
import UnknownStep from "./unknownStep";
import VariableDecrementStep from "./variable/variableDecrementStep";
import VariableIncrementStep from "./variable/variableIncrementStep";
import VariableRandomIntStep from "./variable/variableRandomIntStep";
import VariableSetStep from "./variable/variableSetStep";
import {
    WriteCameraRotationStep,
    WriteCarCoordsStep,
    WriteCarTrackDirectionStep,
    WriteGuestCoordsStep,
    WriteGuestDirectionStep,
    WriteStaffCoordsStep,
    WriteStaffDirectionStep,
    WriteTriggerTileStep
} from "./variable/writeMapValueSteps";
import WaitStep from "./waitStep";

export default function createStep(data: StepDesc | StepDescBase): Step {
    switch (data.type) {
        case "wait":
            return new WaitStep(data as WaitStepDesc);
        case "carEditColour":
            return new CarEditColourStep(data as CarEditColourStepDesc);
        case "trainEditColour":
            return new TrainEditColourStep(data as TrainEditColourStepDesc);
        case "variableSet":
            return new VariableSetStep(data as VariableSetStepDesc);
        case "variableIncrement":
            return new VariableIncrementStep(data as VariableIncrementStepDesc);
        case "variableDecrement":
            return new VariableDecrementStep(data as VariableDecrementStepDesc);
        case "variableRandomInt":
            return new VariableRandomIntStep(data as VariableRandomIntStepDesc);
        case "writeTriggerTile":
            return new WriteTriggerTileStep(data as WriteTriggerTileStepDesc);
        case "writeCarCoords":
            return new WriteCarCoordsStep(data as WriteCarCoordsStepDesc);
        case "writeGuestCoords":
            return new WriteGuestCoordsStep(data as WriteGuestCoordsStepDesc);
        case "writeStaffCoords":
            return new WriteStaffCoordsStep(data as WriteStaffCoordsStepDesc);
        case "writeCameraRotation":
            return new WriteCameraRotationStep(data as WriteCameraRotationStepDesc);
        case "writeGuestDirection":
            return new WriteGuestDirectionStep(data as WriteGuestDirectionStepDesc);
        case "writeStaffDirection":
            return new WriteStaffDirectionStep(data as WriteStaffDirectionStepDesc);
        case "writeCarTrackDirection":
            return new WriteCarTrackDirectionStep(data as WriteCarTrackDirectionStepDesc);
        case "trackSetHeight":
            return new TrackSetHeightStep(data as TrackSetHeightStepDesc);
        case "switchTiTrackOrder":
            return new SwitchTiTrackOrderStep(data as SwitchTiTrackOrderStepDesc);
        case "trackChainLift":
            return new TrackChainLiftStep(data as TrackChainLiftStepDesc);
        case "liftDropTrack":
            return new LiftDropTrackStep(data as LiftDropTrackStepDesc);
        case "carCoordsOverTime":
            return new CarCoordsOverTimeStep(data as CarCoordsOverTimeStepDesc);
        case "trainCoordsOverTime":
            return new TrainCoordsOverTimeStep(data as TrainCoordsOverTimeStepDesc);
        case "sceneryVisibility":
            return new SceneryVisibilityStep(data as SceneryVisibilityStepDesc);
        case "sceneryRecolour":
            return new SceneryRecolourStep(data as SceneryRecolourStepDesc);
        case "sceneryRotation":
            return new SceneryRotationStep(data as SceneryRotationStepDesc);
        case "trackColourScheme":
            return new TrackColourSchemeStep(data as TrackColourSchemeStepDesc);
        case "trackSeatRotation":
            return new TrackSeatRotationStep(data as TrackSeatRotationStepDesc);
        case "trackInverted":
            return new TrackInvertedStep(data as TrackInvertedStepDesc);
        case "trackBrakeSpeed":
            return new TrackBrakeSpeedStep(data as TrackBrakeSpeedStepDesc);
        case "trackHighlighted":
            return new TrackHighlightedStep(data as TrackHighlightedStepDesc);
        case "blockBrake":
            return new BlockBrakeStep(data as BlockBrakeStepDesc);
        case "landHeight":
            return new LandHeightStep(data as LandHeightStepDesc);
        case "waterHeight":
            return new WaterHeightStep(data as WaterHeightStepDesc);
        case "landSlope":
            return new LandSlopeStep(data as LandSlopeStepDesc);
        case "surfaceStyle":
            return new SurfaceStyleStep(data as SurfaceStyleStepDesc);
        case "edgeStyle":
            return new EdgeStyleStep(data as EdgeStyleStepDesc);
        case "grassLength":
            return new GrassLengthStep(data as GrassLengthStepDesc);
        case "pathAdditionVandalised":
            return new PathAdditionVandalisedStep(data as PathAdditionVandalisedStepDesc);
        case "pathBinFull":
            return new PathBinFullStep(data as PathBinFullStepDesc);
        case "pathLitter":
            return new PathLitterStep(data as PathLitterStepDesc);
        case "bannerText":
            return new BannerTextStep(data as BannerTextStepDesc);
        case "bannerColours":
            return new BannerColoursStep(data as BannerColoursStepDesc);
        case "bannerNoEntry":
            return new BannerNoEntryStep(data as BannerNoEntryStepDesc);
        case "carVelocity":
        case "carAcceleration":
        case "carMass":
        case "carBankRotation":
        case "carSpin":
        case "carPoweredAcceleration":
        case "carPoweredMaxSpeed":
        case "carTravelBy":
            return new CarNumberStep(data as CarNumberStepDesc);
        case "carReversed":
        case "carCrashed":
            return new CarToggleStep(data as CarToggleStepDesc);
        case "carStatus":
            return new CarStatusStep(data as CarStatusStepDesc);
        case "carMoveToTrack":
            return new CarMoveToTrackStep(data as CarMoveToTrackStepDesc);
        case "rideStatus":
            return new RideStatusStep(data as RideStatusStepDesc);
        case "rideVehicleColours":
            return new RideVehicleColoursStep(data as RideVehicleColoursStepDesc);
        case "rideTrackColours":
            return new RideTrackColoursStep(data as RideTrackColoursStepDesc);
        case "rideMusic":
            return new RideMusicStep(data as RideMusicStepDesc);
        case "rideStationStart":
            return new RideStationStartStep(data as RideStationStartStepDesc);
        case "rideStationStyle":
        case "rideMode":
        case "rideDepartFlags":
        case "rideMinWait":
        case "rideMaxWait":
        case "rideLiftHillSpeed":
            return new RideNumberStep(data as RideNumberStepDesc);
        case "rideBreakdown":
            return new RideBreakdownStep(data as RideBreakdownStepDesc);
        case "rideFixBreakdown":
            return new RideFixBreakdownStep(data as RideFixBreakdownStepDesc);
        case "guestNeed":
            return new GuestNeedStep(data as GuestNeedStepDesc);
        case "guestClothes":
            return new GuestClothesStep(data as GuestClothesStepDesc);
        case "guestFavouriteRide":
            return new GuestFavouriteRideStep(data as GuestFavouriteRideStepDesc);
        case "guestGiveItem":
        case "guestRemoveItem":
            return new GuestItemStep(data as GuestItemStepDesc);
        case "guestAnimation":
            return new GuestAnimationStep(data as GuestAnimationStepDesc);
        case "guestFlag":
            return new GuestFlagStep(data as GuestFlagStepDesc);
        case "guestMove":
            return new GuestMoveStep(data as GuestMoveStepDesc);
        case "setCarCoords":
            return new SetCarCoordsStep(data as SetCarCoordsStepDesc);
        case "setStaffCoords":
            return new SetStaffCoordsStep(data as SetStaffCoordsStepDesc);
        case "staffCostume":
            return new StaffCostumeStep(data as StaffCostumeStepDesc);
        case "staffOrders":
            return new StaffOrdersStep(data as StaffOrdersStepDesc);
        case "staffPatrol":
            return new StaffPatrolStep(data as StaffPatrolStepDesc);
        case "staffAnimation":
            return new StaffAnimationStep(data as StaffAnimationStepDesc);
        case "staffFlag":
            return new StaffFlagStep(data as StaffFlagStepDesc);
        case "spawnGuest":
            return new SpawnGuestStep(data as SpawnGuestStepDesc);
        case "parkMessage":
            return new ParkMessageStep(data as ParkMessageStepDesc);
        case "freezeWeather":
            return new FreezeWeatherStep(data as FreezeWeatherStepDesc);
        case "parkCash":
            return new ParkCashStep(data as ParkCashStepDesc);
        case "parkRating":
            return new ParkRatingStep(data as ParkRatingStepDesc);
        case "grantAward":
            return new GrantAwardStep(data as GrantAwardStepDesc);
        case "clearAwards":
            return new ClearAwardsStep(data as ClearAwardsStepDesc);
        case "gamePause":
            return new GamePauseStep(data as GamePauseStepDesc);
        case "gameSpeed":
            return new GameSpeedStep(data as GameSpeedStepDesc);
        case "parkDate":
            return new ParkDateStep(data as ParkDateStepDesc);
        case "viewportCamera":
            return new ViewportCameraStep(data as ViewportCameraStepDesc);
        case "customJavascript":
            return new CustomJavascriptStep(data as CustomJavascriptStepDesc);
        case "branch":
            return new BranchStep(data as BranchStepDesc);
        case "contextMutate":
            return new ContextMutateStep(data as ContextMutateStepDesc);
        default:
            return new UnknownStep(data);
    }
}
