import get from 'lodash/get';
import set from 'lodash/set';
import invert from 'lodash/invert';
import { Rect } from './rect';
import { v2 } from './vec2';
export var AnchorPoint;
(function (AnchorPoint) {
    AnchorPoint[AnchorPoint["North"] = 0] = "North";
    AnchorPoint[AnchorPoint["NorthEast"] = 1] = "NorthEast";
    AnchorPoint[AnchorPoint["East"] = 2] = "East";
    AnchorPoint[AnchorPoint["SouthEast"] = 3] = "SouthEast";
    AnchorPoint[AnchorPoint["South"] = 4] = "South";
    AnchorPoint[AnchorPoint["SouthWest"] = 5] = "SouthWest";
    AnchorPoint[AnchorPoint["West"] = 6] = "West";
    AnchorPoint[AnchorPoint["NorthWest"] = 7] = "NorthWest";
    AnchorPoint[AnchorPoint["Center"] = 8] = "Center";
})(AnchorPoint || (AnchorPoint = {}));
export var CenteringAxis;
(function (CenteringAxis) {
    CenteringAxis[CenteringAxis["X"] = 0] = "X";
    CenteringAxis[CenteringAxis["Y"] = 1] = "Y";
    CenteringAxis[CenteringAxis["Both"] = 2] = "Both";
})(CenteringAxis || (CenteringAxis = {}));
export const AnchorPositions = {
    [AnchorPoint.North]: { x: 0.5, y: 0 },
    [AnchorPoint.NorthEast]: { x: 1, y: 0 },
    [AnchorPoint.East]: { x: 1, y: 0.5 },
    [AnchorPoint.SouthEast]: { x: 1, y: 1 },
    [AnchorPoint.South]: { x: 0.5, y: 1 },
    [AnchorPoint.SouthWest]: { x: 0, y: 1 },
    [AnchorPoint.West]: { x: 0, y: 0.5 },
    [AnchorPoint.NorthWest]: { x: 0, y: 0 },
    [AnchorPoint.Center]: { x: 0.5, y: 0.5 },
};
export class ScalableRectangle extends Rect {
    constructor(options) {
        super(options);
        this.scaleX = options.scaleX || 1.0;
        this.scaleY = options.scaleY || 1.0;
        this.crop = Object.assign({ top: 0, bottom: 0, left: 0, right: 0 }, options.crop);
        this.rotation = options.rotation || 0;
        this.origin = v2(AnchorPositions[AnchorPoint.NorthWest]);
    }
    get croppedWidth() {
        return this.width - this.crop.left - this.crop.right;
    }
    get croppedHeight() {
        return this.height - this.crop.top - this.crop.bottom;
    }
    get scaledWidth() {
        return this.scaleX * this.croppedWidth;
    }
    get scaledHeight() {
        return this.scaleY * this.croppedHeight;
    }
    get aspectRatio() {
        return this.getAspectRatio();
    }
    get scaledAspectRatio() {
        return this.scaledWidth / this.scaledHeight;
    }
    setAnchor(anchor) {
        this.setOrigin(AnchorPositions[anchor]);
    }
    setOrigin(newOriginModel) {
        const currentPosition = this.origin;
        const newOrigin = v2(newOriginModel);
        const delta = newOrigin.sub(currentPosition);
        const newPosition = this.getPosition().add(delta.multiply(v2(this.scaledWidth, this.scaledHeight)));
        this.setPosition(newPosition);
        this.origin = newOrigin;
    }
    zeroRotation() {
        const mapFields = {};
        let origin = AnchorPositions[AnchorPoint.NorthWest];
        if (this.rotation === 90) {
            mapFields['width'] = 'height';
            mapFields['height'] = 'width';
            mapFields['scaleX'] = 'scaleY';
            mapFields['scaleY'] = 'scaleX';
            mapFields['crop.top'] = 'crop.left';
            mapFields['crop.right'] = 'crop.top';
            mapFields['crop.bottom'] = 'crop.right';
            mapFields['crop.left'] = 'crop.bottom';
            origin = AnchorPositions[AnchorPoint.NorthEast];
        }
        else if (this.rotation === 180) {
            mapFields['crop.top'] = 'crop.bottom';
            mapFields['crop.right'] = 'crop.left';
            mapFields['crop.bottom'] = 'crop.top';
            mapFields['crop.left'] = 'crop.right';
            origin = AnchorPositions[AnchorPoint.SouthEast];
        }
        else if (this.rotation === 270) {
            mapFields['width'] = 'height';
            mapFields['height'] = 'width';
            mapFields['scaleX'] = 'scaleY';
            mapFields['scaleY'] = 'scaleX';
            mapFields['crop.top'] = 'crop.right';
            mapFields['crop.right'] = 'crop.bottom';
            mapFields['crop.bottom'] = 'crop.left';
            mapFields['crop.left'] = 'crop.top';
            origin = AnchorPositions[AnchorPoint.SouthWest];
        }
        this.mapFields(mapFields);
        this.origin = v2(origin);
        this.setAnchor(AnchorPoint.NorthWest);
        const rotation = this.rotation;
        this.rotation = 0;
        return () => {
            this.rotation = rotation;
            this.setOrigin(origin);
            this.mapFields(invert(mapFields));
        };
    }
    mapFields(fields) {
        const currentValues = {};
        Object.keys(fields).forEach(key => {
            currentValues[key] = get(this, fields[key]);
        });
        Object.keys(fields).forEach(key => {
            set(this, key, currentValues[key]);
        });
    }
    withAnchor(anchor, fun) {
        this.withOrigin(AnchorPositions[anchor], fun);
    }
    withOrigin(origin, fun) {
        const oldOrigin = this.origin;
        this.setOrigin(origin);
        fun();
        this.setOrigin(oldOrigin);
    }
    normalize() {
        const derotate = this.zeroRotation();
        const xFlipped = this.scaleX < 0;
        const yFlipped = this.scaleY < 0;
        if (xFlipped)
            this.flipX();
        if (yFlipped)
            this.flipY();
        return () => {
            if (xFlipped)
                this.flipX();
            if (yFlipped)
                this.flipY();
            derotate();
        };
    }
    normalized(fun) {
        const denormalize = this.normalize();
        fun();
        denormalize();
    }
    flipX() {
        this.scaleX *= -1;
        this.x -= this.scaledWidth;
        const leftCrop = this.crop.left;
        this.crop.left = this.crop.right;
        this.crop.right = leftCrop;
    }
    flipY() {
        this.scaleY *= -1;
        this.y -= this.scaledHeight;
        const topCrop = this.crop.top;
        this.crop.top = this.crop.bottom;
        this.crop.bottom = topCrop;
    }
    stretchAcross(rect) {
        this.normalized(() => rect.normalized(() => {
            this.x = rect.x;
            this.y = rect.y;
            this.scaleX = rect.scaledWidth / this.croppedWidth;
            this.scaleY = rect.scaledHeight / this.croppedHeight;
        }));
    }
    fitTo(rect) {
        this.normalized(() => rect.normalized(() => {
            if (this.aspectRatio > rect.scaledAspectRatio) {
                this.scaleX = rect.scaledWidth / this.croppedWidth;
                this.scaleY = this.scaleX;
            }
            else {
                this.scaleY = rect.scaledHeight / this.croppedHeight;
                this.scaleX = this.scaleY;
            }
            this.centerOn(rect);
        }));
    }
    centerOn(rect, axis) {
        this.normalized(() => rect.normalized(() => {
            this.withAnchor(AnchorPoint.Center, () => {
                rect.withAnchor(AnchorPoint.Center, () => {
                    switch (axis) {
                        case CenteringAxis.X:
                            this.x = rect.x;
                            break;
                        case CenteringAxis.Y:
                            this.y = rect.y;
                            break;
                        default:
                            this.x = rect.x;
                            this.y = rect.y;
                    }
                });
            });
        }));
    }
}
//# sourceMappingURL=ScalableRectangle.js.map