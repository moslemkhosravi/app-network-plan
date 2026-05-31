// frontend/src/lib/templates/cisco_2960_24tc.ts

export const Cisco2960Template = {
  manufacturer: "Cisco",
  model_name: "Catalyst 2960-24TC-L",
  // در صورتی که عکس واقعی سوییچ را داری، آدرس آن را در پوشه public قرار بده و اینجا بنویس
  // مثلا: "/images/switches/cisco-2960.png"
  image_url: null, 
  ports: [
    { name: "Console", port_type: "console", pos_x: 95.0, pos_y: 50.0 },
    { name: "Gi1/0/1", port_type: "rj45", pos_x: 10.0, pos_y: 30.0 },
    { name: "Gi1/0/2", port_type: "rj45", pos_x: 10.0, pos_y: 70.0 },
    { name: "Gi1/0/3", port_type: "rj45", pos_x: 14.0, pos_y: 30.0 },
    { name: "Gi1/0/4", port_type: "rj45", pos_x: 14.0, pos_y: 70.0 },
    { name: "Gi1/0/5", port_type: "rj45", pos_x: 18.0, pos_y: 30.0 },
    { name: "Gi1/0/6", port_type: "rj45", pos_x: 18.0, pos_y: 70.0 },
    { name: "Gi1/0/7", port_type: "rj45", pos_x: 22.0, pos_y: 30.0 },
    { name: "Gi1/0/8", port_type: "rj45", pos_x: 22.0, pos_y: 70.0 },
    { name: "Gi1/0/9", port_type: "rj45", pos_x: 26.0, pos_y: 30.0 },
    { name: "Gi1/0/10", port_type: "rj45", pos_x: 26.0, pos_y: 70.0 },
    { name: "Gi1/0/11", port_type: "rj45", pos_x: 30.0, pos_y: 30.0 },
    { name: "Gi1/0/12", port_type: "rj45", pos_x: 30.0, pos_y: 70.0 },
    { name: "Gi1/0/13", port_type: "rj45", pos_x: 40.0, pos_y: 30.0 },
    { name: "Gi1/0/14", port_type: "rj45", pos_x: 40.0, pos_y: 70.0 },
    { name: "Gi1/0/15", port_type: "rj45", pos_x: 44.0, pos_y: 30.0 },
    { name: "Gi1/0/16", port_type: "rj45", pos_x: 44.0, pos_y: 70.0 },
    { name: "Gi1/0/17", port_type: "rj45", pos_x: 48.0, pos_y: 30.0 },
    { name: "Gi1/0/18", port_type: "rj45", pos_x: 48.0, pos_y: 70.0 },
    { name: "Gi1/0/19", port_type: "rj45", pos_x: 52.0, pos_y: 30.0 },
    { name: "Gi1/0/20", port_type: "rj45", pos_x: 52.0, pos_y: 70.0 },
    { name: "Gi1/0/21", port_type: "rj45", pos_x: 56.0, pos_y: 30.0 },
    { name: "Gi1/0/22", port_type: "rj45", pos_x: 56.0, pos_y: 70.0 },
    { name: "Gi1/0/23", port_type: "rj45", pos_x: 60.0, pos_y: 30.0 },
    { name: "Gi1/0/24", port_type: "rj45", pos_x: 60.0, pos_y: 70.0 },
    { name: "Gi1/0/25", port_type: "sfp", pos_x: 80.0, pos_y: 30.0 },
    { name: "Gi1/0/26", port_type: "sfp", pos_x: 80.0, pos_y: 70.0 }
  ]
};