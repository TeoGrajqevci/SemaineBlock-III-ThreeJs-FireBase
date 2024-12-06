/**
 * EdgeGlowMaterial by OpenAI Assistant - Dec 2023.
 */
import {
  ShaderMaterial,
  Uniform,
  Color,
  AdditiveBlending,
  FrontSide,
  BackSide,
  DoubleSide,
} from "three";

class EdgeGlowMaterial extends ShaderMaterial {
  /**
   * Create an EdgeGlowMaterial with specular highlights and roughness.
   *
   * @param {Object} parameters - The parameters to configure the material.
   * @param {Color} [parameters.edgeColor=new Color(0xffffff)] - The color of the edge glow.
   * @param {number} [parameters.edgeIntensity=10.0] - The intensity of the edge glow.
   * @param {number} [parameters.edgeWidth=1.0] - The width of the edge glow.
   * @param {number} [parameters.insideTransparency=0.4] - The transparency of the inside.
   * @param {Color} [parameters.specularColor=new Color(0xffffff)] - The color of the specular highlight.
   * @param {number} [parameters.roughness=0.5] - The roughness of the material (controls shininess).
   * @param {number} [parameters.side=FrontSide] - The rendering side.
   */
  constructor(parameters = {}) {
    super();

    this.vertexShader = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        // Compute normal and view position
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;

        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    this.fragmentShader = `
      uniform vec3 edgeColor;
      uniform float edgeIntensity;
      uniform float edgeWidth;
      uniform float insideTransparency;
      uniform vec3 specularColor;
      uniform float roughness;

  

      varying vec3 vNormal;
      varying vec3 vViewPosition;

 

      void main() {
           vec3 lightPos1 = vec3(2.0, 1.0, 5.0);
        vec3 lightPos2 = vec3(-10.0, 3.0, 12.0);
        // Normalize normals
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Edge detection
        float edge = 1.0 - abs(normal.z);
        edge = pow(edge, edgeWidth);

        // Edge glow color
        vec3 edgeGlow = edgeColor * edge * edgeIntensity;

        // Blinn-Phong specular highlight
        vec3 lightDir1 = normalize(lightPos1);
        vec3 lightDir2 = normalize(lightPos2);
        vec3 halfVector1 = normalize(lightDir1 + lightPos1);
        vec3 halfVector2 = normalize(lightDir2 + lightPos2);
        float specAngle1 = max(dot(normal, halfVector1), 0.0);
        float specAngle2 = max(dot(normal, halfVector2), 0.0);
        float specular1 = pow(specAngle1, mix(1.0, 128.0, 1.0 - roughness));
        float specular2 = pow(specAngle2, mix(1.0, 128.0, 1.0 - roughness));

        // Specular color
        vec3 specularHighlight1 = specularColor * specular1;
        vec3 specularHighlight2 = specularColor * specular2;

        // Final color
        vec3 color = edgeGlow + specularHighlight1 + specularHighlight2;
       
        // Apply transparency
        gl_FragColor = vec4(color, mix(insideTransparency, 1.0, edge));
      }
    `;

    this.uniforms = {
      edgeColor: new Uniform(
        parameters.edgeColor !== undefined
          ? new Color(parameters.edgeColor)
          : new Color(0x808080)
      ),
      //////////////
      edgeIntensity: new Uniform(
        parameters.edgeIntensity !== undefined ? parameters.edgeIntensity : 2.0
      ),
      edgeWidth: new Uniform(
        parameters.edgeWidth !== undefined ? parameters.edgeWidth : 2.0
      ),
      ///////////////
      insideTransparency: new Uniform(
        parameters.insideTransparency !== undefined
          ? parameters.insideTransparency
          : 10
      ),
      specularColor: new Uniform(
        parameters.specularColor !== undefined
          ? new Color(parameters.specularColor)
          : new Color(0x808080)
      ),
      roughness: new Uniform(
        parameters.roughness !== undefined ? parameters.roughness : 0.6
      ),
    };

    this.transparent = true;
    this.side = parameters.side !== undefined ? parameters.side : FrontSide;
    this.blending = AdditiveBlending;
    this.depthWrite = false;
  }
}

export default EdgeGlowMaterial;
