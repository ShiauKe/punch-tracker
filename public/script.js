console.log('This is a placeholder for the script.js file.');


main()



async function main() {
  try {
    const res = await fetecResultFormatted();
    if (res) {
      console.log('Data fetched successfully:', res);
      const allDate = new Set(res.map(item => item.date))
      let gridApi;
      data = res[0]
      const rowData = getRowData(data)
      
      const gridOptions = getGridOptions(rowData);
      const myGridElement = document.querySelector('#myGrid');
      gridApi = agGrid.createGrid(myGridElement, gridOptions);
      renderDateButtons(allDate,res,gridApi);

    } else {
      console.error('No data found or error occurred.');
    }     
  }catch(error) {
    console.error('Error in main function:', error);
  }
}

async function fetecResultFormatted() {
  try {
    const response = await fetch('/excels/result_formatted.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const dataWrapper = await response.json();
    const data = dataWrapper.allData
    // console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching result_formatted.json:', error);
    return null;
  }
}

function getRowData(data){
  console.log('getRowData:', data)
 return data.data.map(item => {
        // console.log(item)
        const mi = item.final_punches.find(final_punch=> final_punch.inferPunchStatus==='mi').time
        const mo = item.final_punches.find(final_punch=> final_punch.inferPunchStatus==='mo').time
        const ai = item.final_punches.find(final_punch=> final_punch.inferPunchStatus==='ai').time
        const ao = item.final_punches.find(final_punch=> final_punch.inferPunchStatus==='ao').time
        const name = item.name
        const hasAbnormal = item.existAbnormalPunchStatus
        // console.log('name',name, mi, 'mo:', mo, 'ai:', ai, 'ao:', ao)
        return {
          Name: item.name,
          MI: mi || 'N/A', // 如果沒有打卡，顯示 N/A
          MO: mo || 'N/A',
          AI: ai || 'N/A',
          AO: ao || 'N/A',
          AbnormalDetection: hasAbnormal,
          OnLeave: item.onLeaveObj.onLeaveAutoFill,
          OverTime: item.overTimeObj.overTimeAutoFill,
        } 
      }
      ) 
}

function renderDateButtons(allDate,res,gridApi){
  const dateContainer = document.getElementById('dateSelector')
  allDate.forEach(date => {
          const button = document.createElement('button')
          button.className = 'dateButton'
          button.textContent = date
          button.addEventListener('click', () => {
            const allbuttons = document.querySelectorAll('.dateButton');
            allbuttons.forEach(b => b.classList.remove('clicked'));
            button.classList.add('clicked');

            console.log('Button clicked for date:', date)
            const data = res.find(item => item.date === date)
            console.log('data:', data)
            const rowData = getRowData(data)
            
            console.log('rowDataB:', rowData)
            gridApi.setGridOption("rowData", rowData);
          })
          dateContainer.appendChild(button) 
  })
}

function getGridOptions(rowData){
  return {
        rowData: rowData,
        columnDefs: [
            { field: "Name" },
            { field: "MI" },
            { field: "MO" },
            { field: "AI" },
            { field: "AO" },
            // { field: "AbnormalDetection"},
            { field: "OnLeave" },
            { field: "OverTime"},
        ],
        defaultColDef: {
          flex: 1,
          headerClass: 'ag-center-header'
        },
        pagination: true,
        paginationPageSize: 50,
        paginationPageSizeSelector: [40,50,60],
    }
}