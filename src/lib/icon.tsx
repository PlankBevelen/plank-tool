import React from 'react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string
}

const Icon: React.FC<IconProps> = ({ name, className, ...props }) => {
  const symbolId = `#icon-${name}`

  return (
    <svg 
      className={className} 
      aria-hidden="true" 
      {...props}
    >
      <use href={symbolId} />
    </svg>
  )
}

export default Icon
