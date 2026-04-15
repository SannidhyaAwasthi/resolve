package com.resolve.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CompileRequest {
    @NotBlank(message = "LaTeX code is required")
    private String latexCode;
}
