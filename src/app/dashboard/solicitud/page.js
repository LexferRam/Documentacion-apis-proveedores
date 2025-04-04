"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import FormSolicitud from "./_componentes/formSolicitud";
import Axios from "axios";

export const listaValor = {
  c_detalle_api: [
    {
      NOMBRE: "Aprobado",
      PRODUCTO: "A",
    },
    {
      NOMBRE: "Rechazado",
      PRODUCTO: "R",
    },
  ],
};


function useSessionStorage(key) {
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const item = sessionStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    }
  }, [key]);

  return value;
}

const Page = () => {
  const profile = useSessionStorage("PROFILE_KEY");
  const codigoPerfil = profile?.PROFILE_CODE;

   console.log('intermediario' ,codigoPerfil )

  const [show, setShow] = useState(false);
  const [dataHistorico, setDataHistorico] = useState({
    c_solicitud: [],
    c_det_solicitud: [],
  });
  const [dataHistoricoSolicitudes, setDataHistoricoSolicitudes] = useState({
    c_solicitud: [],
    c_det_solicitud: [],
  });
  const [selectedValues, setSelectedValues] = useState({});
  const [changes, setChanges] = useState([]);
  const [tabValue, setTabValue] = useState(0); // Estado para controlar el tab activo

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOnClick = () => {
    setShow(true);
  };

  const handleSelectChange = (event, rowId) => {
    const [masterId, productName, codApi] = rowId.split("_");
    const newValue = event.target.value;

    setSelectedValues((prev) => ({
      ...prev,
      [rowId]: newValue,
    }));

    setChanges((prev) => {
      const existingChangeIndex = prev.findIndex(
        (change) =>
          change.ID_SOLICITUD === masterId && change.NOMBRE === productName
      );

      if (existingChangeIndex >= 0) {
        const updatedChanges = [...prev];
        updatedChanges[existingChangeIndex].ESTATUS =
          newValue === "Aprobado" ? "A" : "R";
        return updatedChanges;
      } else {
        return [
          ...prev,
          {
            ID_SOLICITUD: masterId,
            NOMBRE: productName,
            ESTATUS: newValue === "Aprobado" ? "A" : "R",
            URL:
              event.target.value === "Aprobado"
                ? "URL_APROBADO"
                : "URL_RECHAZADO",
            CODIGO_API: codApi,
          },
        ];
      }
    });
  };

  const handleUpdateClick = async (masterData) => {
    try {
      const detallesActualizados = changes.filter(
        (change) =>
          change.ID_SOLICITUD.toString() === masterData.ID_SOLICITUD.toString()
      );

      if (detallesActualizados.length === 0) {
        alert("No hay cambios para actualizar en esta solicitud");
        return;
      }

      const apiPayload = {
        p_cia: 1,
        p_id_solicitud: masterData.ID_SOLICITUD,
        p_estatus: "A",
        arr_apis: detallesActualizados.map((d) => d.CODIGO_API).join("|"),
        arr_apis_sts: detallesActualizados.map((d) => d.ESTATUS).join("|"),
      };

      const response = await Axios.post(
        "https://segurospiramide.com/asg-api/dbo/doc_api/sp_Actualizar_solicitud",
        apiPayload
      );

      if (response.status === 200) {
        setDataHistorico({
          c_solicitud: [],
          c_det_solicitud: [],
        });
        setDataHistoricoSolicitudes(
          response.data || {
            c_solicitud: [],
            c_det_solicitud: [],
          }
        );
        constDataHistorico();
        constDataHistoricoSolicitudes();
        setChanges((prev) =>
          prev.filter(
            (change) => change.ID_SOLICITUD !== masterData.ID_SOLICITUD
          )
        );
        alert("Actualización exitosa");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert(`Error al actualizar: ${error.message}`);
    }
  };

  const constDataHistorico = async () => {
    try {

       console.log('ver valor' ,codigoPerfil )
      const params = {
        p_cia: 1,
        p_codinter: codigoPerfil === "insurance_broker"? profile.p_insurance_broker_code:  "0",
      };
      const response = await Axios.post(
        "https://segurospiramide.com/asg-api/dbo/doc_api/sp_consulta_solicitudes",
        params
      );
      setDataHistorico(
        response.data || {
          c_solicitud: [],
          c_det_solicitud: [],
        }
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      setDataHistorico({
        c_solicitud: [],
        c_det_solicitud: [],
      });
    }
  };

  const constDataHistoricoSolicitudes = async () => {
    try {
      const params = {
        p_cia: 1,
        p_codinter: codigoPerfil === "insurance_broker" ? profile.p_insurance_broker_code :  "0",
      };
      
       console.log('ver valor params' ,params )

      const response = await Axios.post(
        "https://segurospiramide.com/asg-api/dbo/doc_api/sp_consulta_solicitudes_hist",
        params
      );
      setDataHistoricoSolicitudes(
        response.data || {
          c_solicitud: [],
          c_det_solicitud: [],
        }
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      setDataHistoricoSolicitudes({
        c_solicitud: [],
        c_det_solicitud: [],
      });
    }
  };

  useEffect(() => {
    if(codigoPerfil !== undefined){
      constDataHistorico();
      constDataHistoricoSolicitudes();
    }
  }, [codigoPerfil]);

  const transformedData = useMemo(
    () =>
      dataHistorico.c_solicitud?.map((solicitud) => ({
        ...solicitud,
        FECHA: new Date(solicitud.FECHA).toLocaleDateString(),
        detalles: dataHistorico.c_det_solicitud.filter(
          (det) => det.ID_SOLICITUD === solicitud.ID_SOLICITUD
        ),
      })),
    [dataHistorico]
  );

  const transformedDataHistorico = useMemo(
    () =>
      dataHistoricoSolicitudes.c_solicitud?.map((solicitud) => ({
        ...solicitud,
        FECHA: new Date(solicitud.FECHA).toLocaleDateString(),
        detalles: dataHistoricoSolicitudes.c_det_solicitud.filter(
          (det) => det.ID_SOLICITUD === solicitud.ID_SOLICITUD
        ),
      })),
    [dataHistoricoSolicitudes]
  );

  const transformedDataAsesor = useMemo(
    () =>
      dataHistorico.c_solicitud?.map((solicitud) => ({
        ...solicitud,
        FECHA: new Date(solicitud.FECHA).toLocaleDateString(),
        detalles: dataHistorico.c_det_solicitud.filter(
          (det) => det.ID_SOLICITUD === solicitud.ID_SOLICITUD
        ),
      })),
    [dataHistorico]
  );

  const detailColumns = useMemo(
    () => [

       {
        accessorKey: "NOMBRE",
        header: "Producto",
        size: 200,
      },
      {
        accessorKey: "CODIGO_API",
        header: "Código Producto",
        size: 200,
      },
      {
        accessorKey: "ESTATUS",
        header: "Estatus",
        size: 100,
        Cell: ({ cell }) => (
          <span
            style={{
              color:
                cell.getValue() === "A"
                  ? "green"
                  : cell.getValue() === "P"
                  ? "orange"
                  : "red",
              fontWeight: "bold",
            }}
          >
            {cell.getValue() === "A"
              ? "Aprobado"
              : cell.getValue() === "P"
              ? "Pendiente"
              : "Rechazado"}
          </span>
        ),
      },
      {
        accessorKey: "URL",
        header: "URL",
        size: 300,
        Cell: ({ cell }) => (
          <a href={cell.getValue()} target="_blank" rel="noopener noreferrer">
            {cell.getValue()}
          </a>
        ),
      },
      {
        header: "Acción",
        size: 120,
        Cell: ({ row }) => {
          const rowId = `${row.original.ID_SOLICITUD}_${row.original.NOMBRE}_${row.original.CODIGO_API}`;
          return (
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id={`select-label-${rowId}`}>Estatus</InputLabel>
              <Select
                labelId={`select-label-${rowId}`}
                id={`select-${rowId}`}
                value={selectedValues[rowId] || ""}
                onChange={(e) => handleSelectChange(e, rowId)}
              >
                <MenuItem value="">
                  <em>Seleccionar</em>
                </MenuItem>
                {listaValor.c_detalle_api.map((item, index) => (
                  <MenuItem key={index} value={item.NOMBRE}>
                    {item.NOMBRE}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        },
      },
    ],
    [selectedValues]
  );

  const detailColumnsHistorico = useMemo(
    () => [
      {
        accessorKey: "NOMBRE",
        header: "Producto",
        size: 200,
      },

      {
        accessorKey: "ESTATUS",
        header: "Estatus",
        size: 100,
        Cell: ({ cell }) => (
          <span
            style={{
              color:
                cell.getValue() === "A"
                  ? "green"
                  : cell.getValue() === "P"
                  ? "orange"
                  : "red",
              fontWeight: "bold",
            }}
          >
            {cell.getValue() === "A"
              ? "Aprobado"
              : cell.getValue() === "P"
              ? "Pendiente"
              : "Rechazado"}
          </span>
        ),
      },
      {
        accessorKey: "URL",
        header: "URL",
        size: 300,
        Cell: ({ cell }) => (
          <a href={cell.getValue()} target="_blank" rel="noopener noreferrer">
            {cell.getValue()}
          </a>
        ),
      },
    ],
    []
  );

  const detailColumnsAsesor = useMemo(
    () => [
      {
        accessorKey: "NOMBRE",
        header: "Producto",
        size: 200,
      },

      {
        accessorKey: "ESTATUS",
        header: "Estatus",
        size: 100,
        Cell: ({ cell }) => (
          <span
            style={{
              color:
                cell.getValue() === "A"
                  ? "green"
                  : cell.getValue() === "P"
                  ? "orange"
                  : "red",
              fontWeight: "bold",
            }}
          >
            {cell.getValue() === "A"
              ? "Aprobado"
              : cell.getValue() === "P"
              ? "Pendiente"
              : "Rechazado"}
          </span>
        ),
      },
      {
        accessorKey: "URL",
        header: "URL",
        size: 300,
        Cell: ({ cell }) => (
          <a href={cell.getValue()} target="_blank" rel="noopener noreferrer">
            {cell.getValue()}
          </a>
        ),
      },
    ],
    []
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "ID_SOLICITUD",
        header: "Nro. Solcitud",
        size: 120,
      },
      {
        accessorKey: "FECHA",
        header: "Fecha",
        size: 120,
      },
      {
        accessorKey: "CONTACTO",
        header: "Contacto",
        size: 180,
      },
      {
        accessorKey: "EMAIL",
        header: "Email",
        size: 200,
      },
      {
        accessorKey: "TELF_CONTACTO",
        header: "Teléfono",
        size: 120,
      },
      {
        accessorKey: "ESTATUS",
        header: "Estatus",
        size: 100,
        Cell: ({ cell }) => (
          <span
            style={{
              color:
                cell.getValue() === "A"
                  ? "green"
                  : cell.getValue() === "P"
                  ? "orange"
                  : "red",
              fontWeight: "bold",
            }}
          >
            {cell.getValue() === "A"
              ? "Aprobado"
              : cell.getValue() === "P"
              ? "Pendiente"
              : "Rechazado"}
          </span>
        ),
      },
      {
        header: "Acción",
        size: 80,
        Cell: ({ row }) => {
          const hasChanges = changes.some(
            (change) =>
              change.ID_SOLICITUD.toString() ===
              row.original.ID_SOLICITUD.toString()
          );
          return (
            <Tooltip
              title={
                hasChanges
                  ? "Actualizar cambios"
                  : "No hay cambios para actualizar"
              }
            >
              <Button
                size="small"
                variant="contained"
                color={"inherit"}
                onClick={() => handleUpdateClick(row.original)}
                disabled={!hasChanges}
                sx={{
                  backgroundColor: hasChanges ? "#eb4215" : "#e0e0e0",
                  color: hasChanges ? "white" : "#9e9e9e",
                  "&:hover": {
                    backgroundColor: hasChanges ? "#c2330e" : "#e0e0e0",
                  },
                }}
              >
                Actualizar
              </Button>
            </Tooltip>
          );
        },
      },
    ],
    [changes]
  );

  const columnsHistorico = useMemo(
    () => [
      {
        accessorKey: "ID_SOLICITUD",
        header: "Nro. Solcitud",
        size: 120,
      },
      {
        accessorKey: "FECHA",
        header: "Fecha",
        size: 120,
      },
      {
        accessorKey: "CONTACTO",
        header: "Contacto",
        size: 180,
      },
      {
        accessorKey: "EMAIL",
        header: "Email",
        size: 200,
      },
      {
        accessorKey: "TELF_CONTACTO",
        header: "Teléfono",
        size: 120,
      },
      {
        accessorKey: "ESTATUS",
        header: "Estatus",
        size: 100,
        Cell: ({ cell }) => (
          <span
            style={{
              color:
                cell.getValue() === "A"
                  ? "green"
                  : cell.getValue() === "P"
                  ? "orange"
                  : "red",
              fontWeight: "bold",
            }}
          >
            {cell.getValue() === "A"
              ? "Aprobado"
              : cell.getValue() === "P"
              ? "Pendiente"
              : "Rechazado"}
          </span>
        ),
      },
    ],
    []
  );

  const columnAsesor = useMemo(
    () => [
      {
        accessorKey: "ID_SOLICITUD",
        header: "Nro. Solcitud",
        size: 120,
      },
      {
        accessorKey: "FECHA",
        header: "Fecha",
        size: 120,
      },
      {
        accessorKey: "CONTACTO",
        header: "Contacto",
        size: 180,
      },
      {
        accessorKey: "EMAIL",
        header: "Email",
        size: 200,
      },
      {
        accessorKey: "TELF_CONTACTO",
        header: "Teléfono",
        size: 120,
      },
      {
        accessorKey: "ESTATUS",
        header: "Estatus",
        size: 100,
        Cell: ({ cell }) => (
          <span
            style={{
              color:
                cell.getValue() === "A"
                  ? "green"
                  : cell.getValue() === "P"
                  ? "orange"
                  : "red",
              fontWeight: "bold",
            }}
          >
            {cell.getValue() === "A"
              ? "Aprobado"
              : cell.getValue() === "P"
              ? "Pendiente"
              : "Rechazado"}
          </span>
        ),
      },

    ],
    []
  );


  const table = useMaterialReactTable({
    columns,
    data: transformedData,
    localization: MRT_Localization_ES,
    enableExpandAll: true,
    enableExpanding: true,
    filterFromLeafRows: true,
    initialState: { expanded: false },
    paginateExpandedRows: true,
    muiTableHeadCellProps: {
      sx: {
        background: "#eb4215",
        color: "white",
        fontWeight: "bold",
        fontSize: "0.9rem",
      },
    },
    renderDetailPanel: ({ row }) => {
      const detalles = row.original.detalles || [];

      return (
        <Box sx={{ padding: "16px", width: "100%" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                {detailColumns.map((column) => (
                  <th
                    key={column.accessorKey || column.header}
                    style={{
                      padding: "8px",
                      textAlign: "left",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index}>
                  {detailColumns.map((column) => (
                    <td
                      key={column.accessorKey || column.header}
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #e0e0e0",
                      }}
                    >
                      {column.Cell ? (
                        <column.Cell
                          cell={{ getValue: () => detalle[column.accessorKey] }}
                          row={{ original: detalle }}
                        />
                      ) : (
                        detalle[column.accessorKey]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      );
    },
  });

  const tableHistoricoSolicitudes = useMaterialReactTable({
    columns: columnsHistorico,
    data: transformedDataHistorico,
    localization: MRT_Localization_ES,
    enableExpandAll: true,
    enableExpanding: true,
    filterFromLeafRows: true,
    initialState: { expanded: false },
    paginateExpandedRows: true,
    muiTableHeadCellProps: {
      sx: {
        background: "#eb4215",
        color: "white",
        fontWeight: "bold",
        fontSize: "0.9rem",
      },
    },
    renderDetailPanel: ({ row }) => {
      const detalles = row.original.detalles || [];

      return (
        <Box sx={{ padding: "0px", width: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              padding: "0px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                {detailColumnsHistorico.map((column) => (
                  <th
                    key={column.accessorKey || column.header}
                    style={{
                      padding: "8px",
                      textAlign: "left",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index}>
                  {detailColumnsHistorico.map((column) => (
                    <td
                      key={column.accessorKey || column.header}
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #e0e0e0",
                      }}
                    >
                      {column.Cell ? (
                        <column.Cell
                          cell={{ getValue: () => detalle[column.accessorKey] }}
                          row={{ original: detalle }}
                        />
                      ) : (
                        detalle[column.accessorKey]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      );
    },
  });

  const tableAsesor = useMaterialReactTable({
    columns: columnAsesor,
    data: transformedDataAsesor,
    localization: MRT_Localization_ES,
    enableExpandAll: true,
    enableExpanding: true,
    filterFromLeafRows: true,
    initialState: { expanded: false },
    paginateExpandedRows: true,
    muiTableHeadCellProps: {
      sx: {
        background: "#eb4215",
        color: "white",
        fontWeight: "bold",
        fontSize: "0.9rem",
      },
    },
    renderDetailPanel: ({ row }) => {
      const detalles = row.original.detalles || [];

      return (
        <Box sx={{ padding: "0px", width: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              padding: "0px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                {detailColumnsHistorico.map((column) => (
                  <th
                    key={column.accessorKey || column.header}
                    style={{
                      padding: "8px",
                      textAlign: "left",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index}>
                  {detailColumnsHistorico.map((column) => (
                    <td
                      key={column.accessorKey || column.header}
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #e0e0e0",
                      }}
                    >
                      {column.Cell ? (
                        <column.Cell
                          cell={{ getValue: () => detalle[column.accessorKey] }}
                          row={{ original: detalle }}
                        />
                      ) : (
                        detalle[column.accessorKey]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      );
    },
  });






  return (
    <>
      {!show ? (
        <Container component="main" maxWidth="xl">
          <Card elevation={6} sx={{ width: "100%", marginBottom: 3 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6">Gestión de Solicitudes</Typography>
            </Box>
            <Divider />

            {/* Tabs para navegar entre las secciones */}
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="solicitudes tabs"
                sx={{
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#eb4215",
                  },
                }}
              >
                <Tab label="Solicitudes Actuales" />
                <Tab label="Histórico de Solicitudes" />
              </Tabs>
            </Box>

            {codigoPerfil === "insurance_broker" && (
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{ m: 3 }}
                    color="error"
                    onClick={handleOnClick}
                  >
                    Nueva Solicitud
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* Contenido de cada tab */}
            <Box>
              {tabValue === 0 && <MaterialReactTable table={ codigoPerfil !== "insurance_broker" ? table: tableAsesor} />}
              {tabValue === 1 && (
                <MaterialReactTable table={tableHistoricoSolicitudes} />
              )}
            </Box>
          </Card>
        </Container>
      ) : (
        <FormSolicitud show={show} setShow={setShow}/>
      )}
    </>
  );
};

export default Page;
