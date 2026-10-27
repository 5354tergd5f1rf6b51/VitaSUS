const express = require("express");
const router = express.Router();

// Usa o Prisma client centralizado, criado uma única vez para a aplicação.
const prisma = require("../prisma/client");

// LISTAR TODOS OS PACIENTE
// GET /PACIENTES
router.get("/", async function (req, res) {
  try {
    const usuarios = await prisma.paciente.findMany(); // SELECT * FROM usuarios    
    res.status(200).json(pacientes);
  } catch (error) {
    console.error("Erro ao listar paciente:", error);
    res.status(500).json({ error: "Falha ao listar paciete" });
  }
});

// BUSCAR UM  PACIENTE POR CPF
// GET /Pacientes/:cpf
router.get("/:cpf", async function (req, res) {
  try {
    const { cpf } = req.params;

    const paciente = await prisma.paciente.findUnique({
      where: { cpf }
    });

    if (!paciente) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    return res.status(200).json(paciente);
  } catch (error) {
    console.error("Erro ao buscar paciente:", error);
    return res.status(500).json({ error: "Falha ao buscar paciente" });
  }
});

// CRIAR UM NOVO PACIENTE
// POST // PACIENTES
router.post("/", async function (req, res) {
  try {
    const { cpf, nomePaciente, emailPaciente, senhaPaciente } = req.body;

    if (!cpf || !nomePaciente || !emailPaciente || !senhaPaciente) {
      return res.status(400).json({
        error: "CPF, nome, e-mail e senha são obrigatórios."
      });
    }

    const paciente = await prisma.paciente.create({
      data: {
        cpf,
        nomePaciente,
        emailPaciente,
        senhaPaciente
      }
    });

    res.status(201).json(paciente);
  } catch (error) {
    console.error("Erro ao criar paciente:", error?.message || error);

    if (error.code === "P2002") {
      return res.status(409).json({ error: "Já existe um paciente com esse CPF ou e-mail." });
    }

    return res.status(500).json({
      error: "Falha ao criar paciente",
      detail: error?.message || "Erro interno do banco de dados"
    });
  }
});

// ATUALIZAR UM PACIENTE
// PUT /Paciente/:cpf
router.put("/:cpf", async function (req, res) {
  try {
    const { cpf } = req.params;
    const { nomePaciente, emailPaciente, senhaPaciente } = req.body;

    const PacienteAtualizado = await prisma.paciente.update({
      where: { cpf },
      data: {
        nomePaciente,
        emailPaciente,
        senhaPaciente
      }
    });

    res.status(200).json(pacienteAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Paciente não encontrado para atualizar" });
    }

    return res.status(500).json({ error: "Falha ao atualizar paciente" });
  }
});

// EXCLUIR UM PACIENTE
// DELETE /Paciente/:cpf
router.delete("/:cpf", async function (req, res) {
  try {
    const { cpf } = req.params;

    await prisma.paciente.delete({
      where: { cpf }
    });

    res.status(200).json({ message: "Paciente deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir paciente:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Paciente não encontrado para deletar" });
    }

    return res.status(500).json({ error: "Falha ao deletar paciente" });
  }
});

module.exports = router;