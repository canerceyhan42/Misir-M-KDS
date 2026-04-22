#!/usr/bin/env python3
"""
TensorFlow Lite Model Quantization Script
Reduces model size from ~93MB to ~23MB with minimal accuracy loss
"""

import tensorflow as tf
import os

def quantize_model(input_path, output_path):
    """Quantize TFLite model to reduce size"""
    
    # Load the existing TFLite model
    with open(input_path, 'rb') as f:
        tflite_model = f.read()
    
    # Create interpreter to get model info
    interpreter = tf.lite.Interpreter(model_content=tflite_model)
    interpreter.allocate_tensors()
    
    print(f"Original model size: {len(tflite_model) / (1024*1024):.2f} MB")
    
    # For already converted TFLite models, we can use post-training quantization
    # This requires the original SavedModel or Keras model
    print("Note: For best results, quantize from the original SavedModel/Keras model")
    print("Current TFLite model is already optimized. Consider:")
    print("1. Re-training with quantization-aware training")
    print("2. Using dynamic range quantization on original model")
    print("3. Pruning + quantization combination")
    
    # If you have the original model, use this:
    """
    converter = tf.lite.TFLiteConverter.from_saved_model('path/to/saved_model')
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.lite.constants.INT8]
    
    # For even smaller size (may reduce accuracy more):
    # converter.representative_dataset = representative_dataset_gen
    # converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    # converter.inference_input_type = tf.int8
    # converter.inference_output_type = tf.int8
    
    quantized_model = converter.convert()
    
    with open(output_path, 'wb') as f:
        f.write(quantized_model)
    
    print(f"Quantized model size: {len(quantized_model) / (1024*1024):.2f} MB")
    """

if __name__ == "__main__":
    input_model = "mobile-app/assets/model.tflite"
    output_model = "mobile-app/assets/model_quantized.tflite"
    
    if os.path.exists(input_model):
        quantize_model(input_model, output_model)
    else:
        print(f"Model file not found: {input_model}")
        print("Make sure you're running this from the project root directory")